
import React from 'react';
import { Info } from 'lucide-react';
import AdBanner from '../AdBanner';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
          <Info className="text-blue-600" size={32} />
          当サイトについて
        </h2>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-lg leading-relaxed font-medium text-gray-600 dark:text-gray-300">
            「まいつーる」は、日常のちょっとした作業を効率化するための、インストール不要・登録不要の無料Webツール集です。<br/>
            QRコード作成、画像編集、PDF操作、テキスト処理など、40種類以上のツールをブラウザひとつで利用できます。
          </p>

          <hr className="border-gray-100 dark:border-gray-800" />

          <h3 className="text-xl font-bold mt-8 mb-4 text-slate-800 dark:text-white">
            プライバシーファーストの設計思想
          </h3>
          <p>
            当サイトの最大の特徴は、<strong>「徹底したローカル処理」</strong>です。<br/>
            一般的なオンラインツールとは異なり、画像のリサイズやPDFの結合、家計簿データの入力など、ほとんどの処理をお客様のブラウザ内（クライアントサイド）で完結させています。
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <ul className="list-disc list-inside space-y-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
              <li>アップロードした画像がサーバーに送信されることはありません。</li>
              <li>入力したパスワードや機密テキストが外部に漏れることはありません。</li>
              <li>家計簿やメモのデータは、お使いの端末（ブラウザ）にのみ保存されます。</li>
            </ul>
          </div>

          <h3 className="text-xl font-bold mt-8 mb-4 text-slate-800 dark:text-white">
            高速で快適な動作
          </h3>
          <p>
            最新のWeb技術（React, Vite, WebAssemblyなど）を駆使し、ネイティブアプリのような軽快な操作感を実現しています。<br/>
            サーバー通信を極力減らすことで、通信環境が不安定な場所でもサクサク動作します。
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4 text-slate-800 dark:text-white">
            運営方針
          </h3>
          <p>
            当サイトは個人開発によって運営されており、すべての機能を完全無料で提供しています。<br/>
            サーバー維持費および開発費のために、一部の画面で広告を表示させていただいております。ご利用の皆様にはご不便をおかけすることもあるかと存じますが、サービスの継続的な改善と維持のため、ご理解いただけますと幸いです。
          </p>
        </div>
      </div>
      <AdBanner />
    </div>
  );
};

export default About;
