import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;

  return {
    title: "用户风险画像 · RiskOS",
    description:
      "面向风控调查人员的用户风险画像查询原型，聚合账号信息、风险标签、风险日志与关联关系。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "用户风险画像 · RiskOS",
      description: "从任一线索出发，聚合账号、设备与网络关系。",
      type: "website",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1731,
          height: 909,
          alt: "用户风险画像产品预览",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "用户风险画像 · RiskOS",
      description: "从任一线索出发，聚合账号、设备与网络关系。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
