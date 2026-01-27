
import React from 'react';
import { Scale, AlertTriangle, FileText } from 'lucide-react';
import AdBanner from '../AdBanner';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      <div className="bg-white dark:bg-dark-lighter rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
          <Scale className="text-gray-600 dark:text-gray-300" size={32} />
          利用規約
        </h2>
        
        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
          <p>
            この利用規約（以下，「本規約」といいます。）は，まいつーる（以下，「当サイト」といいます。）がこのウェブサイト上で提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。ご利用の皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。
          </p>

          <h3 className="text-lg font-bold mt-8 mb-4 border-b pb-2 dark:border-gray-700">第1条（適用）</h3>
          <p>本規約は，ユーザーと当サイトとの間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>

          <h3 className="text-lg font-bold mt-8 mb-4 border-b pb-2 dark:border-gray-700">第2条（禁止事項）</h3>
          <p>ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
          <ul className="list-disc list-inside mt-2 space-y-1 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl text-red-700 dark:text-red-300 font-medium">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当サイトのサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
            <li>当サイトのサービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>不正アクセスをし，またはこれを試みる行為</li>
            <li>その他，当サイトが不適切と判断する行為</li>
          </ul>

          <h3 className="text-lg font-bold mt-8 mb-4 border-b pb-2 dark:border-gray-700 flex items-center gap-2">
             <AlertTriangle size={20} /> 第3条（免責事項）
          </h3>
          <p>
            当サイトは，本サービスに事実上または法律上の瑕疵（安全性，信頼性，正確性，完全性，有効性，特定の目的への適合性，セキュリティなどに関する欠陥，エラーやバグ，権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。<br/>
            当サイトは，本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
          </p>

          <h3 className="text-lg font-bold mt-8 mb-4 border-b pb-2 dark:border-gray-700">第4条（サービス内容の変更等）</h3>
          <p>
            当サイトは，ユーザーに通知することなく，本サービスの内容を変更し，または本サービスの提供を中止することができるものとし，これによってユーザーに生じた損害について一切の責任を負いません。
          </p>

          <h3 className="text-lg font-bold mt-8 mb-4 border-b pb-2 dark:border-gray-700">第5条（利用規約の変更）</h3>
          <p>
            当サイトは，必要と判断した場合には，ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお，本規約の変更後，本サービスを開始した場合には，当該ユーザーは変更後の規約に同意したものとみなします。
          </p>
        </div>
      </div>
      <AdBanner />
    </div>
  );
};

export default Terms;
