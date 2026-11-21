// O Origin Certificate da Cloudflare para `minimalme.dev`: a chave nasce e fica na VPS, só o
// pedido de assinatura (CSR) sai de lá, e o roteiro confere o certificado que volta, que é
// público, antes de o Autor gravá-lo ao lado da chave.
import { X509Certificate } from "node:crypto";

export const hostnames = ["minimalme.dev", "*.minimalme.dev"];

// O diretório `/data/coolify/proxy` da VPS aparece como `/traefik` dentro do contêiner do
// Traefik que o Coolify sobe, como na receita de certificado de origem do Coolify.
const hostDirectory = "/data/coolify/proxy/certs";
const proxyDirectory = "/traefik/certs";
const keyFile = "minimalme.dev.key";
const certificateFile = "minimalme.dev.cert";
const requestFile = "minimalme.dev.csr";

export const cloudflareOriginUrl =
  "https://dash.cloudflare.com/?to=/:account/minimalme.dev/ssl-tls/origin";

export const dynamicConfigurationName = "minimalme-dev-origin.yaml";

// A chave só é gerada se ainda não existe, para uma segunda rodada não trocar a chave de um
// certificado já carregado; o comando mostra só o CSR.
export const requestCommand = [
  `mkdir -p ${hostDirectory}`,
  `cd ${hostDirectory}`,
  `{ [ -e ${keyFile} ] || openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -keyout ${keyFile} -subj /CN=minimalme.dev -out ${requestFile}; }`,
  `chmod 600 ${keyFile}`,
  `cat ${requestFile}`,
].join(" && ");

export const dynamicConfiguration = [
  "tls:",
  "  certificates:",
  `    - certFile: ${proxyDirectory}/${certificateFile}`,
  `      keyFile: ${proxyDirectory}/${keyFile}`,
].join("\n");

/** Grava o certificado conferido ao lado da chave e prova que os dois formam um par. */
export function writeCommand(certificate) {
  const encoded = Buffer.from(certificate).toString("base64");
  return [
    `cd ${hostDirectory}`,
    `printf '%s' '${encoded}' | base64 -d > ${certificateFile}`,
    `[ "$(openssl x509 -noout -pubkey -in ${certificateFile})" = "$(openssl pkey -pubout -in ${keyFile})" ]`,
    `echo "certificado e chave conferem"`,
  ].join(" && ");
}

const minimumYears = 14;

/**
 * Confere um Origin Certificate colado pelo Autor: emitido pela Origin CA da Cloudflare, para
 * os dois nomes da zona e com a validade de 15 anos que a spec pede.
 * @returns {{ ok: true, validTo: string, fingerprint256: string }
 *   | { ok: false, problems: string[] }}
 */
export function inspectCertificate(pem, now) {
  let certificate;
  try {
    certificate = new X509Certificate(pem);
  } catch {
    return { ok: false, problems: ["o texto colado não é um certificado PEM"] };
  }
  const problems = [];
  if (!/CloudFlare Origin SSL/i.test(certificate.issuer)) {
    problems.push("o certificado não foi emitido pela Origin CA da Cloudflare");
  }
  const names = (certificate.subjectAltName ?? "")
    .split(",")
    .map((entry) => entry.trim().replace(/^DNS:/, ""));
  if (!hostnames.every((hostname) => names.includes(hostname))) {
    problems.push(`o certificado não cobre ${hostnames.map((name) => `\`${name}\``).join(" e ")}`);
  }
  const validTo = new Date(certificate.validTo);
  const limit = new Date(now);
  limit.setUTCFullYear(limit.getUTCFullYear() + minimumYears);
  if (validTo < limit) {
    problems.push(
      `o certificado vale menos de ${minimumYears} anos; escolha 15 anos na Cloudflare`,
    );
  }
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, validTo: validTo.toISOString(), fingerprint256: certificate.fingerprint256 };
}
