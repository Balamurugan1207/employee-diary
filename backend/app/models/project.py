from app.extensions import db


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    client = db.relationship("Client", back_populates="projects")
    timesheet_entries = db.relationship("TimesheetEntry", back_populates="project")
