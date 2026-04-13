import enum
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


class RoleEnum(enum.Enum):
    ADMIN = "admin"
    TEAM_LEAD = "team_lead"
    EMPLOYEE = "employee"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.EMPLOYEE)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    timesheet_entries = db.relationship(
        "TimesheetEntry",
        back_populates="user",
        lazy="dynamic",
        foreign_keys="TimesheetEntry.user_id",
    )
    led_teams = db.relationship(
        "Team", back_populates="lead", foreign_keys="Team.lead_id"
    )
    team_memberships = db.relationship("TeamMembership", back_populates="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
