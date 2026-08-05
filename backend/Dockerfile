FROM python:3.12-slim

WORKDIR /app

# Dépendances système
# openssh-client : requis par app/services/hosting_service.py (le worker SSH
# vers l'hôte VPS pour déclencher le provisioning vhost/SSL d'un domaine acheté)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code source
COPY . .

# Utilisateur non-root
# HOME est fixé explicitement + ~/.ssh pré-créé : le client ssh (StrictHostKeyChecking=
# accept-new) doit pouvoir écrire son known_hosts, sinon il échoue silencieusement
# faute de HOME résolu dans l'environnement du conteneur.
# UID fixé à 10001 (pas laissé au hasard d'adduser) : le fichier de clé privée
# SSH monté depuis l'hôte doit appartenir à ce même UID avec le mode 600 — sinon
# le client ssh refuse la clé ("Permissions too open") dès qu'on tourne en
# non-root. Un UID déterministe permet de faire le chown correspondant sur le
# VPS sans dépendre de ce qu'adduser aurait choisi.
ENV HOME=/home/appuser
RUN adduser --disabled-password --gecos "" --uid 10001 appuser \
    && mkdir -p /home/appuser/.ssh \
    && chown -R appuser:appuser /home/appuser/.ssh \
    && chmod 700 /home/appuser/.ssh \
    && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
