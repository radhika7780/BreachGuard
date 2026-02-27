from sqlalchemy import Column, Integer, String, DateTime
from .database import Base
import datetime

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    email = Column(String(120), unique=True)

    def __init__(self, username=None, email=None):
        self.username = username
        self.email = email

    def __repr__(self):
        return f'<User {self.username!r}>'
