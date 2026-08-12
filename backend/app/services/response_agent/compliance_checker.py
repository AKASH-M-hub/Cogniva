import re
from typing import Tuple, List
from app.schemas.chat_schema import ComplianceResult

# Regex patterns for sensitive information
PATTERNS = {
    "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
    "credit_card": r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4})\b',
    "email_private": r'\b[A-Za-z0-9._%+-]+@privatecompany\.com\b',
    "salary_amount": r'\b\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|INR)?\s*(?:per annum|salary|compensation)\b'
}


def check_and_apply_compliance(text: str, user_role: str = "user") -> Tuple[str, ComplianceResult]:
    """
    Enterprise Compliance Checker:
    Detects and masks sensitive, restricted, or PII information based on user role.
    """
    role_lower = user_role.lower()
    masked_count = 0
    clean_text = text
    notes = []

    # Admins and HR/Finance managers bypass basic PII masking for enterprise operations
    if "admin" in role_lower or "hr_manager" in role_lower or "executive" in role_lower:
        return text, ComplianceResult(compliant=True, masked_sensitive_terms_count=0, compliance_notes="Role granted full enterprise data access.")

    for data_type, pattern in PATTERNS.items():
        matches = re.findall(pattern, clean_text, flags=re.IGNORECASE)
        if matches:
            masked_count += len(matches)
            clean_text = re.sub(pattern, f"[REDACTED {data_type.upper()}]", clean_text, flags=re.IGNORECASE)
            notes.append(f"Redacted {len(matches)} instance(s) of {data_type}.")

    is_compliant = True
    note_str = " ".join(notes) if notes else "Fully compliant with enterprise data protection standards."

    return clean_text, ComplianceResult(
        compliant=is_compliant,
        masked_sensitive_terms_count=masked_count,
        compliance_notes=note_str
    )
