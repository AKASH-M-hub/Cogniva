import re
from typing import List, Dict, Any
from app.schemas.chat_schema import ResponseContradiction


def detect_cross_document_contradictions(results: List[Any]) -> ResponseContradiction:
    """
    Contradiction Detection Engine:
    Scans retrieved document chunks for conflicting numbers, days, percentages, or dates.
    """
    if len(results) < 2:
        return ResponseContradiction(conflict_detected=False)

    numeric_facts = []

    for item in results:
        file_name = getattr(item, "file_name", "Unknown Document")
        content = getattr(item, "content", "")

        # Extract numeric leave / policy specifications (e.g., "30 days", "25 days", "180 days")
        days_matches = re.findall(r'(\d+)\s*(?:days|day|days leave|days wfh|hours)', content, flags=re.IGNORECASE)
        for val in days_matches:
            numeric_facts.append({
                "source": file_name,
                "value": int(val),
                "raw": f"{val} days"
            })

    if len(numeric_facts) >= 2:
        values_by_source = {}
        for fact in numeric_facts:
            src = fact["source"]
            if src not in values_by_source:
                values_by_source[src] = set()
            values_by_source[src].add(fact["value"])

        sources = list(values_by_source.keys())
        for i in range(len(sources)):
            for j in range(i + 1, len(sources)):
                src1 = sources[i]
                src2 = sources[j]
                vals1 = values_by_source[src1]
                vals2 = values_by_source[src2]

                if vals1 and vals2 and vals1 != vals2:
                    val1_str = ", ".join(str(v) for v in vals1)
                    val2_str = ", ".join(str(v) for v in vals2)
                    conflict_msg = (
                        f"Potential discrepancy detected across documents: '{src1}' specifies {val1_str} days, "
                        f"whereas '{src2}' specifies {val2_str} days."
                    )
                    return ResponseContradiction(
                        conflict_detected=True,
                        details=conflict_msg,
                        conflicting_sources=[src1, src2]
                    )

    return ResponseContradiction(conflict_detected=False)
