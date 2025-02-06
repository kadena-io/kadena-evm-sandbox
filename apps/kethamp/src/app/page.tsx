import { Accounts } from "@app/components/panel/accounts";
import Panel from "@app/components/panel/panel";
import { Transactions } from "@app/components/panel/transactions";

export default function Main() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <Panel />
      <Accounts />
      <Transactions />
    </div>
  );
}
