import os
from dotenv import load_dotenv

load_dotenv()  # 🔥 .env 로드

class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://"
        f"{os.getenv('DB_USER')}:"
        f"{os.getenv('DB_PASSWORD')}@"
        f"{os.getenv('DB_HOST')}:"
        f"{os.getenv('DB_PORT')}/"
        f"{os.getenv('DB_NAME')}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_TOKEN_LOCATION = ["headers"]          # ⭐ 헤더에서만 토큰 읽기
    JWT_HEADER_NAME = "Authorization"         # ⭐ Authorization 헤더
    JWT_HEADER_TYPE = "Bearer"                # ⭐ Bearer xxx 형식 강제

    JWT_ERROR_MESSAGE_KEY = "message"          # 에러 메시지 통일