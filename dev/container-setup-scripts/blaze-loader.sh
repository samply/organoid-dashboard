wget -qO - https://github.com/samply/blazectl/releases/download/v0.17.0/blazectl-0.17.0-linux-amd64.tar.gz | tar -xzf - blazectl
./blazectl --server http://blaze:8080/fhir upload json-fhir-bundles
