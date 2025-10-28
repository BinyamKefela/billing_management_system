FROM python:3.11-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_HTTP_TIMEOUT=120

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libtiff5-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libwebp-dev \
    tcl8.6-dev \
    tk8.6-dev \
    python3-tk \
    pkg-config \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY BillManagementSystem/requirements.txt .
RUN uv pip install -r requirements.txt --system

COPY BillManagementSystem/ .
COPY entrypoint.prod.sh /entrypoint.prod.sh

RUN chmod +x /entrypoint.prod.sh

EXPOSE 8000

CMD ["/entrypoint.prod.sh"]
