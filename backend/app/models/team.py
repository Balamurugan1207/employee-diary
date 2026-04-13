from app.extensions import db


class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    lead = db.relationship("User", back_populates="led_teams", foreign_keys=[lead_id])
    members = db.relationship("TeamMembership", back_populates="team")


class TeamMembership(db.Model):
    __tablename__ = "team_memberships"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    __table_args__ = (db.UniqueConstraint("team_id", "user_id"),)

    team = db.relationship("Team", back_populates="members")
    user = db.relationship("User", back_populates="team_memberships")
