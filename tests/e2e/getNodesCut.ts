import {
  $devnet,
  DOCKER_COMPOSE_FILE,
  type DevnetStatus,
} from './devnet-utils';
import { createLogger, fetchWithRetry } from './utils';
const log = createLogger({ context: 'getNodesCut.ts' });

type CutResponse = {
  hashes: Record<
    string,
    {
      height: number;
      hash: string;
    }
  >;
  origin: null | string;
  weight: string;
  height: number;
  instance: string;
  id: string;
};

export async function getNodesCut() {
  const dockerComposePs =
    await $devnet`docker compose -f ${DOCKER_COMPOSE_FILE} ps --format json`;
  const services = dockerComposePs.lines().map((line) => JSON.parse(line));
  const consensusServices = services
    .filter((s) => s.Names.includes('consensus'))
    .map((x) => ({ ...x, Labels: '' }))
    .map((s) => ({
      name: s.Names,
      port:
        s.Publishers.find((p) => p.TargetPort === 1848)?.PublishedPort || 1848,
    }));
  // http://localhost:11848/chainweb/0.0/evm-development/cut
  return await Promise.all(
    consensusServices.map((c) =>
      fetchWithRetry(
        `http://localhost:${c.port}/chainweb/0.0/evm-development/cut`
      ).then((r) => r.json() as Promise<CutResponse>)
    )
  );
}
