"""Minimal, owner-scoped persistence for explicitly saved risk assessments."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import RiskAssessmentRecord
from app.risk.models import MarineRiskAssessment


class RiskAssessmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, user_id: UUID, assessment: MarineRiskAssessment) -> RiskAssessmentRecord:
        record = RiskAssessmentRecord(
            user_id=user_id,
            latitude=assessment.location.latitude,
            longitude=assessment.location.longitude,
            assessment_time=assessment.assessment_time,
            score=assessment.score,
            level=assessment.level,
            risk_model_version=assessment.risk_model_version,
            data_quality=assessment.data_quality,
            provenance_mode=assessment.provenance_mode,
            factors=[factor.model_dump(mode="json") for factor in assessment.factors],
            evidence=[item.model_dump(mode="json") for item in assessment.evidence],
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def list_for_user(self, user_id: UUID, limit: int = 20) -> list[RiskAssessmentRecord]:
        query = select(RiskAssessmentRecord).where(RiskAssessmentRecord.user_id == user_id).order_by(RiskAssessmentRecord.created_at.desc()).limit(limit)
        return list((await self.session.scalars(query)).all())
