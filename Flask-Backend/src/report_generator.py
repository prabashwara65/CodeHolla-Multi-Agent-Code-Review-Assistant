"""Report Generator - Aggregates all findings"""

from typing import Dict, Any, List
from datetime import datetime
from src.logger import mas_logger

class ReportGenerator:
    """Generates final review report"""
    
    @staticmethod
    def generate(state: Dict[str, Any]) -> Dict[str, Any]:
        mas_logger.logger.info("Generating final report")
        
        findings = state.get("findings", [])
        
        # Count issues by category
        style_issues = [f for f in findings if f.get("category") == "style"]
        logic_issues = [f for f in findings if f.get("category") == "logic"]
        security_issues = [f for f in findings if f.get("category") == "security"]
        
        # Calculate scores
        style_score = max(0, 100 - len(style_issues) * 2)
        logic_score = max(0, 100 - len(logic_issues) * 5)
        
        high_severity = [f for f in findings if f.get("severity") in ["high", "critical"]]
        
        # Determine status
        if len(high_severity) > 0:
            overall_status = "FAIL"
            security_risk = "dangerous"
        elif len(findings) > 5:
            overall_status = "WARNING"
            security_risk = "caution"
        else:
            overall_status = "PASS"
            security_risk = "safe"
        
        # Generate recommendations
        recommendations = []
        if len(style_issues) > 2:
            recommendations.append("Fix style issues to improve code readability")
        if len(logic_issues) > 0:
            recommendations.append(f"Address {len(logic_issues)} logic issues before merging")
        if len(security_issues) > 0:
            recommendations.append(f"CRITICAL: Fix {len(security_issues)} security vulnerabilities")
        
        report = {
            "filename": state.get("filename"),
            "review_date": datetime.now().isoformat(),
            "overall_status": overall_status,
            "summary": {
                "style_score": style_score,
                "logic_score": logic_score,
                "security_risk": security_risk,
                "total_findings": len(findings),
                "high_severity_count": len(high_severity)
            },
            "findings": findings,
            "recommendations": recommendations
        }
        
        return report