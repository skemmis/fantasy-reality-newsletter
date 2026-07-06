FROM python:3.12-slim

WORKDIR /srv
COPY pyproject.toml ./
COPY fr_newsletter ./fr_newsletter
COPY app ./app
RUN pip install --no-cache-dir .

ENV MPLBACKEND=Agg
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
