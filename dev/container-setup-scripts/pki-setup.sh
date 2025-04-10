set -e

echo "$VAULT_TOKEN" > /pki/pki.secret

vault secrets enable -path=samply_pki pki

vault write -field=certificate samply_pki/root/generate/internal common_name=broker > /pki/root.crt.pem

vault write samply_pki/roles/myrole allowed_domains=broker allow_subdomains=true

vault write -field=private_key samply_pki/issue/myrole common_name=proxy1.broker ttl=30d > /pki/proxy1.priv.pem
vault write -field=private_key samply_pki/issue/myrole common_name=proxy2.broker ttl=30d > /pki/proxy2.priv.pem
