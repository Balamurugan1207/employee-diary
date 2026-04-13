"""Seed the database with admin user only."""
from app import create_app
from app.extensions import db
from app.models.user import User, RoleEnum

app = create_app()

with app.app_context():
    if not User.query.filter_by(email="it-support@techfinite.com").first():
        admin = User(
            email="it-support@techfinite.com",
            first_name="IT Support",
            last_name="Techfinite",
            role=RoleEnum.ADMIN,
        )
        admin.set_password("Techfinite@25")
        db.session.add(admin)
        db.session.commit()
        print("Created admin user: it-support@techfinite.com / Techfinite@25")
    else:
        print("Admin user already exists")

    print("\nSeed complete!")
