import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    @staticmethod
    def get_db_uri():
        return (
            f"mysql+pymysql://"
            f"{os.environ['DB_USER']}:"
            f"{os.environ['DB_PASSWORD']}@"
            f"{os.environ['DB_HOST']}:"
            f"{os.environ['DB_PORT']}/"
            f"{os.environ['DB_NAME']}"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ERROR_MESSAGE_KEY = "message"
