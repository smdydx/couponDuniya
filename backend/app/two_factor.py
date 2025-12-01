import pyotp
import qrcode
import io
import base64
import secrets
import json
from typing import List


def generate_totp_secret() -> str:
    """Generate a random TOTP secret"""
    return pyotp.random_base32()


def generate_totp_uri(secret: str, email: str, issuer: str = "Coupon Commerce") -> str:
    """Generate a TOTP URI for QR code"""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=issuer
    )


def generate_qr_code(uri: str) -> str:
    """Generate QR code image as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return f"data:image/png;base64,{img_str}"


def verify_totp(secret: str, token: str) -> bool:
    """Verify a TOTP token"""
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)


def generate_backup_codes(count: int = 10) -> List[str]:
    """Generate backup codes"""
    codes = []
    for _ in range(count):
        code = secrets.token_hex(4).upper()  # 8-character hex codes
        codes.append(f"{code[:4]}-{code[4:]}")
    return codes


def hash_backup_codes(codes: List[str]) -> str:
    """Hash and store backup codes as JSON"""
    import hashlib
    hashed = [hashlib.sha256(code.encode()).hexdigest() for code in codes]
    return json.dumps(hashed)


def verify_backup_code(stored_hash: str, code: str) -> bool:
    """Verify a backup code against stored hashes"""
    import hashlib
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    hashed_codes = json.loads(stored_hash)
    return code_hash in hashed_codes


def remove_used_backup_code(stored_hash: str, code: str) -> str:
    """Remove a used backup code from the stored hashes"""
    import hashlib
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    hashed_codes = json.loads(stored_hash)
    if code_hash in hashed_codes:
        hashed_codes.remove(code_hash)
    return json.dumps(hashed_codes)
