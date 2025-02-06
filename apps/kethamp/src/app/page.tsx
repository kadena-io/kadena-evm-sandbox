import { Accounts } from "@app/components/panel/accounts";
import { Deploy } from "@app/components/panel/deploy";
import Panel from "@app/components/panel/panel";
import { Play } from "@app/components/panel/play";
import { Transactions } from "@app/components/panel/transactions";

export default function Main() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <Panel />
      <Accounts />
      <Transactions />
      <Deploy />
      <Play />
    </div>
  );
}
