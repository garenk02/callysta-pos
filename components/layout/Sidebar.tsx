import React from "react";
import Logo from "./Logo";
import Menu from "./Menu";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col">
      <Logo />
      <Menu />
    </aside>
  );
}