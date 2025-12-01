"""Affiliate Network API Clients.

Real implementations for fetching transactions from:
- Admitad (OAuth2)
- VCommission (API Key)
- CueLinks (API Key)

Environment Variables Required:
    ADMITAD_CLIENT_ID, ADMITAD_CLIENT_SECRET, ADMITAD_REFRESH_TOKEN
    VCOMMISSION_API_KEY
    CUELINKS_API_KEY, CUELINKS_PUBLISHER_ID
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import AsyncIterator, Dict, Any

import httpx

logger = logging.getLogger(__name__)

# Admitad OAuth2 Configuration
ADMITAD_CLIENT_ID = os.getenv("ADMITAD_CLIENT_ID")
ADMITAD_CLIENT_SECRET = os.getenv("ADMITAD_CLIENT_SECRET")
ADMITAD_REFRESH_TOKEN = os.getenv("ADMITAD_REFRESH_TOKEN")
ADMITAD_BASE_URL = "https://api.admitad.com"
ADMITAD_TOKEN_URL = "https://api.admitad.com/token/"

# VCommission Configuration
VCOMMISSION_API_KEY = os.getenv("VCOMMISSION_API_KEY")
VCOMMISSION_BASE_URL = "https://track.vcommission.com/api"

# CueLinks Configuration
CUELINKS_API_KEY = os.getenv("CUELINKS_API_KEY")
CUELINKS_PUBLISHER_ID = os.getenv("CUELINKS_PUBLISHER_ID")
CUELINKS_BASE_URL = "https://api.cuelinks.com"


class AdmitadClient:
    """Admitad API client with OAuth2 authentication."""
    
    def __init__(
        self,
        client_id: str = ADMITAD_CLIENT_ID,
        client_secret: str = ADMITAD_CLIENT_SECRET,
        refresh_token: str = ADMITAD_REFRESH_TOKEN,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self.access_token: str | None = None
        self.base_url = ADMITAD_BASE_URL
    
    async def _get_access_token(self) -> str:
        """Get or refresh OAuth2 access token."""
        if self.access_token:
            return self.access_token
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                ADMITAD_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                },
            )
            
            if response.status_code != 200:
                logger.error(f"Admitad token refresh failed: {response.status_code} {response.text}")
                raise Exception(f"Failed to refresh Admitad token: {response.status_code}")
            
            data = response.json()
            self.access_token = data["access_token"]
            # Note: You should also update refresh_token if it changes
            # self.refresh_token = data.get("refresh_token", self.refresh_token)
            
            return self.access_token
    
    async def fetch_transactions(
        self,
        start_date: datetime,
        end_date: datetime,
        status: str = "approved",
    ) -> AsyncIterator[Dict[str, Any]]:
        """Fetch transactions from Admitad API.
        
        Args:
            start_date: Start date for transaction query
            end_date: End date for transaction query
            status: Transaction status filter (approved, pending, declined)
            
        Yields:
            Transaction dictionaries
        """
        if not all([self.client_id, self.client_secret, self.refresh_token]):
            logger.warning("Admitad credentials not configured, skipping...")
            return
        
        try:
            token = await self._get_access_token()
            
            url = f"{self.base_url}/statistics/actions/"
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "date_start": start_date.strftime("%d.%m.%Y"),
                "date_end": end_date.strftime("%d.%m.%Y"),
                "status": status,
                "limit": 500,
                "offset": 0,
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                while True:
                    response = await client.get(url, headers=headers, params=params)
                    
                    if response.status_code != 200:
                        logger.error(f"Admitad API error: {response.status_code} {response.text}")
                        break
                    
                    data = response.json()
                    results = data.get("results", [])
                    
                    if not results:
                        break
                    
                    for row in results:
                        yield {
                            "external_id": str(row.get("action_id")),
                            "status": row.get("status"),
                            "commission_amount": float(row.get("payment", 0) or 0),
                            "order_amount": float(row.get("cart", 0) or 0),
                            "merchant_ext_id": str(row.get("advertiser_id")),
                            "click_ext_id": str(row.get("click_id")),
                            "transaction_date": row.get("action_date"),
                            "network": "admitad",
                        }
                    
                    # Pagination
                    if len(results) < params["limit"]:
                        break
                    
                    params["offset"] += params["limit"]
        
        except Exception as e:
            logger.error(f"Admitad fetch failed: {e}", exc_info=True)


class VCommissionClient:
    """VCommission API client."""
    
    def __init__(self, api_key: str = VCOMMISSION_API_KEY):
        self.api_key = api_key
        self.base_url = VCOMMISSION_BASE_URL
    
    async def fetch_transactions(
        self,
        start_date: datetime,
        end_date: datetime,
        status: str = "approved",
    ) -> AsyncIterator[Dict[str, Any]]:
        """Fetch transactions from VCommission API.
        
        Args:
            start_date: Start date for transaction query
            end_date: End date for transaction query
            status: Transaction status filter
            
        Yields:
            Transaction dictionaries
        """
        if not self.api_key:
            logger.warning("VCommission API key not configured, skipping...")
            return
        
        try:
            url = f"{self.base_url}/v2/transactions"
            params = {
                "apiKey": self.api_key,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "status": status,
                "page": 1,
                "limit": 500,
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                while True:
                    response = await client.get(url, params=params)
                    
                    if response.status_code != 200:
                        logger.error(f"VCommission API error: {response.status_code} {response.text}")
                        break
                    
                    data = response.json()
                    transactions = data.get("transactions", [])
                    
                    if not transactions:
                        break
                    
                    for row in transactions:
                        yield {
                            "external_id": str(row.get("transaction_id")),
                            "status": row.get("status"),
                            "commission_amount": float(row.get("commission", 0) or 0),
                            "order_amount": float(row.get("sale_amount", 0) or 0),
                            "merchant_ext_id": str(row.get("merchant_id")),
                            "click_ext_id": str(row.get("click_id")),
                            "transaction_date": row.get("transaction_date"),
                            "network": "vcommission",
                        }
                    
                    # Pagination
                    if len(transactions) < params["limit"]:
                        break
                    
                    params["page"] += 1
        
        except Exception as e:
            logger.error(f"VCommission fetch failed: {e}", exc_info=True)


class CueLinksClient:
    """CueLinks API client."""
    
    def __init__(
        self,
        api_key: str = CUELINKS_API_KEY,
        publisher_id: str = CUELINKS_PUBLISHER_ID,
    ):
        self.api_key = api_key
        self.publisher_id = publisher_id
        self.base_url = CUELINKS_BASE_URL
    
    async def fetch_transactions(
        self,
        start_date: datetime,
        end_date: datetime,
        status: str = "approved",
    ) -> AsyncIterator[Dict[str, Any]]:
        """Fetch transactions from CueLinks API.
        
        Args:
            start_date: Start date for transaction query
            end_date: End date for transaction query
            status: Transaction status filter
            
        Yields:
            Transaction dictionaries
        """
        if not all([self.api_key, self.publisher_id]):
            logger.warning("CueLinks credentials not configured, skipping...")
            return
        
        try:
            url = f"{self.base_url}/api/v2/getTransactionDetails"
            headers = {"X-API-KEY": self.api_key}
            params = {
                "publisherId": self.publisher_id,
                "startDate": start_date.strftime("%Y-%m-%d"),
                "endDate": end_date.strftime("%Y-%m-%d"),
                "status": status,
                "page": 1,
                "limit": 500,
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                while True:
                    response = await client.get(url, headers=headers, params=params)
                    
                    if response.status_code != 200:
                        logger.error(f"CueLinks API error: {response.status_code} {response.text}")
                        break
                    
                    data = response.json()
                    
                    if data.get("status") != "success":
                        logger.error(f"CueLinks API returned error: {data.get('message')}")
                        break
                    
                    transactions = data.get("data", {}).get("transactions", [])
                    
                    if not transactions:
                        break
                    
                    for row in transactions:
                        yield {
                            "external_id": str(row.get("transactionId")),
                            "status": row.get("status"),
                            "commission_amount": float(row.get("publisherCommission", 0) or 0),
                            "order_amount": float(row.get("saleAmount", 0) or 0),
                            "merchant_ext_id": str(row.get("merchantId")),
                            "click_ext_id": str(row.get("clickId")),
                            "transaction_date": row.get("transactionDate"),
                            "network": "cuelinks",
                        }
                    
                    # Pagination
                    if len(transactions) < params["limit"]:
                        break
                    
                    params["page"] += 1
        
        except Exception as e:
            logger.error(f"CueLinks fetch failed: {e}", exc_info=True)


# Convenience functions for workers
async def fetch_admitad_transactions(
    start_date: datetime,
    end_date: datetime,
) -> AsyncIterator[Dict[str, Any]]:
    """Fetch Admitad transactions."""
    client = AdmitadClient()
    async for transaction in client.fetch_transactions(start_date, end_date):
        yield transaction


async def fetch_vcommission_transactions(
    start_date: datetime,
    end_date: datetime,
) -> AsyncIterator[Dict[str, Any]]:
    """Fetch VCommission transactions."""
    client = VCommissionClient()
    async for transaction in client.fetch_transactions(start_date, end_date):
        yield transaction


async def fetch_cuelinks_transactions(
    start_date: datetime,
    end_date: datetime,
) -> AsyncIterator[Dict[str, Any]]:
    """Fetch CueLinks transactions."""
    client = CueLinksClient()
    async for transaction in client.fetch_transactions(start_date, end_date):
        yield transaction

