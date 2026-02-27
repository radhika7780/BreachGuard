from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
try:
    from .database import Base
except ImportError:
    from database import Base
import datetime

class Email(Base):
    __tablename__ = 'emails'
    id = Column(Integer, primary_key=True)
    email_address = Column(String(255), unique=True, nullable=False)
    risk_score = Column(Float, default=0.0)
    status = Column(String(50), default="SAFE")
    last_checked = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    breaches = relationship("Breach", back_populates="email", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Email {self.email_address!r}>'

class Breach(Base):
    __tablename__ = 'breaches'
    id = Column(Integer, primary_key=True)
    email_id = Column(Integer, ForeignKey('emails.id'), nullable=False)
    breach_name = Column(String(255))
    breach_date = Column(String(100))
    data_types = Column(String(500))
    severity = Column(String(50))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    email = relationship("Email", back_populates="breaches")

    def __repr__(self):
        return f'<Breach {self.breach_name!r}>'

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    email_id = Column(Integer, nullable=True)
    message = Column(String(500))
    severity = Column(String(50))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return f'<Alert {self.message[:20]!r}>'
