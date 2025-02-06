import { metadata } from "./layout";
import Panel from "@app/components/panel/panel";
import { Accounts } from "@app/components/panel/accounts";
import { Deploy } from "@app/components/panel/deploy";
import { Play } from "@app/components/panel/play";
import { Transactions } from "@app/components/panel/transactions";

export default function Main() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] py-10">
      <main className="w-full m-auto max-w-[640px]">
        <Panel
          type="playback"
          title={metadata.title as string ?? "Kadena ETH Denver 2025"}
          data={[
            { 
              blockHeight: 0,
              from: "transaction title 1",
              to: "transaction description 1",
              gasPrice: "1",
              network: "network 1",
              events: [{ name: "event 1", data: "data 1" }],
            },
            { 
              blockHeight: 1,
              from: "transaction title 1",
              to: "transaction description 1",
              gasPrice: "1",
              network: "network 1",
              events: [{ name: "event 1", data: "data 1" }],
            },
            { 
              blockHeight: 2,
              from: "transaction title 1",
              to: "transaction description 1",
              gasPrice: "1",
              network: "network 1",
              events: [{ name: "event 1", data: "data 1" }],
            },
          ]}
        />
        <Accounts />
        <Transactions />
        <Deploy />
        <Play />
      </main>
    </div>
  );
}
