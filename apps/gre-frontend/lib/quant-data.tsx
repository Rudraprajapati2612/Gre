import React from 'react';

export interface QuantChapter {
  id: string;
  title: string;
  tagline: string;
  overview: string[];
  concepts: {
    id: string;
    name: string;
    tagline: string;
    trigger?: string | React.ReactNode;
    shortcut?: string | React.ReactNode;
    trap?: string | React.ReactNode;
  }[];
  frequency: {
    rank: string;
    content: React.ReactNode;
  }[];
  examples: {
    id: string;
    title: string;
    question: React.ReactNode;
    steps: React.ReactNode[];
    takeaway: string | React.ReactNode;
  }[];
  checklist: {
    intro: string;
    items: React.ReactNode[];
    encouragement: React.ReactNode;
  };
  isStudied: boolean;
}

export const QUANT_CHAPTERS: QuantChapter[] = [
  {
    id: "1",
    title: "Inequalities & Absolute Values",
    tagline: "55 questions · logical rules over heavy arithmetic · you can do this",
    overview: [
      "This chapter is about comparing quantities and distances. Inequalities tell you one side is bigger than the other — and absolute values tell you how far a number is from zero (always a positive number). That's it. No exotic formulas.",
      "The GRE tests these topics with logical reasoning, not grueling arithmetic. Almost every question here can be answered by applying one of about five clear rules — and then checking your answer with a quick number plug-in. You will rarely need to do multi-step calculations.",
      "Think of it this way: you're not \"doing math\" — you're following logical rules about size and direction. Someone with a biology background already knows how to track constraints (\"if pH > 7, the solution is basic\") and test cases (\"what happens at the boundary?\"). That is exactly the thinking this chapter rewards."
    ],
    concepts: [
      {
        id: "1",
        name: "Concept 1 — Basic Inequality Solving",
        tagline: "Solve exactly like an equation — with one critical exception.",
        trigger: <>See a variable inside an inequality? → Isolate it the same way you would in an equation: add, subtract, multiply, divide from both sides.<br/><br/><strong>The one rule that's different:</strong> the moment you multiply <em>or</em> divide both sides by a <strong>negative number</strong>, flip the inequality sign. <em>&lt;</em> becomes <em>&gt;</em>, <em>≤</em> becomes <em>≥</em>, and so on.</>,
        shortcut: <>Not sure if you got it right? Plug a number into your answer range and check it against the <em>original</em> inequality. Takes 10 seconds. For example, if you solved and got <em>z ≥ −11</em>, try <em>z = 0</em> (should work) and <em>z = −100</em> (should fail). Both checks passing means you're correct.</>,
        trap: <>Watch out: forgetting to flip the sign when dividing by a negative. Dividing <em>−2z ≥ 22</em> by <em>−2</em> gives <em>z ≤ −11</em>, not <em>z ≥ −11</em>. This single error is responsible for a huge fraction of wrong answers in this chapter.</>
      },
      {
        id: "2",
        name: "Concept 2 — Absolute Value Equations",
        tagline: "|something| = k means the \"something\" could be +k or −k. Two cases, always.",
        trigger: <>See <em>|expression| = k</em>? → <strong>Split into two cases:</strong><br/>&nbsp;&nbsp;Case 1 : expression = +k<br/>&nbsp;&nbsp;Case 2 : expression = −k<br/>Solve both like normal equations. You typically get two values of the variable.</>,
        shortcut: <>After solving both cases, plug each answer back into the original absolute value expression to confirm it actually equals k. One of the two solutions sometimes turns out to be extraneous (doesn't check out). This verification takes under 20 seconds and prevents careless mistakes.</>,
        trap: <>Watch out: solving only one case and moving on. On Quantitative Comparison questions, if x has two valid values — one that makes A bigger and one that makes B bigger — the answer is automatically (D) "Cannot be determined." Missing the second case means missing this entirely.</>
      },
      {
        id: "3",
        name: "Concept 3 — Absolute Value Inequalities",
        tagline: "Two different rules depending on whether it's < or >. Get these two pictures in your head and you're most of the way through this chapter.",
        trigger: <><strong>Rule A · "Less than" → sandwich (middle range):</strong><br/>&nbsp;&nbsp;<em>|expr| &lt; k</em> → <em>−k &lt; expr &lt; k</em><br/>The answer is one connected range between −k and +k.<br/><br/><strong>Rule B · "Greater than" → outside (two separate pieces):</strong><br/>&nbsp;&nbsp;<em>|expr| &gt; k</em> → <em>expr &gt; k</em> <em>or</em> <em>expr &lt; −k</em><br/>The answer is two disconnected ranges pointing away from zero.<br/><br/>Memory anchor: <em>Less than = between. Greater than = beyond.</em></>,
        shortcut: <>Picture the number line before writing a single symbol. "Less than k in absolute value" means: numbers that are <em>close</em> to zero (within k steps). "Greater than k" means: numbers <em>far</em> from zero (more than k steps away). That mental image — close vs. far — is faster and more reliable than memorizing formulas.</>,
        trap: <>Watch out: swapping the two rules. Applying the "sandwich" rule when you should apply the "outside" rule (or vice versa) is the #1 error here. Always confirm: is it &lt; or &gt;? Then deliberately choose the correct rule. Do not rush past this step.</>
      },
      {
        id: "4",
        name: "Concept 4 — Dividing by an Unknown Variable",
        tagline: "You cannot divide both sides of an inequality by a variable unless you know its sign. Unknown sign = unknown flip direction.",
        trigger: <>See a variable in the denominator, or tempted to divide both sides by x? → <strong>Stop and ask:</strong> does the problem tell me the sign of x?<ul className="mt-2 pl-6 list-disc space-y-1 text-sm opacity-90"><li>Sign is known positive → divide normally, no flip.</li><li>Sign is known negative → divide and flip.</li><li>Sign is unknown → do NOT divide. Rearrange algebraically instead, or consider both cases separately.</li></ul></>,
        shortcut: <>When a problem states <em>a/b &gt; 0</em>, that silently tells you a and b have the <em>same sign</em> (both positive or both negative). When it states <em>a/b &lt; 0</em>, they have <em>opposite signs</em>. Use this as a sign-detector without doing any computation.</>,
        trap: <>Watch out: treating an unknown variable as if it must be positive when dividing. Given <em>y &lt; 0</em> and <em>4x &gt; y</em>, if you divide by y you must flip → <em>4x/y &lt; 1</em>. Forgetting to flip because "it felt like a normal divide" gives the wrong direction entirely.</>
      },
      {
        id: "5",
        name: "Concept 5 — Compound & Simultaneous Inequalities",
        tagline: "Two constraints on the same variable — solve each, then find the overlap.",
        trigger: <>Given two separate inequalities involving the same variable? → Solve each independently, then <strong>find the intersection</strong>: the range of values satisfying both at the same time. A quick sketch of the number line makes this visual — draw both ranges and circle the part where they overlap.</>,
        shortcut: <>For "must be true" questions: pick two or three numbers from the overlap zone and test each answer choice. Eliminate any choice that fails for even one of your test numbers. Whatever survives all your tests is the correct answer. You rarely need to work backwards algebraically.</>,
        trap: <>Watch out: "could be true" vs. "must be true." <em>Could be</em> = needs just one example to work. <em>Must be</em> = has to work for every single value in the range. These require entirely different tests. Read the question stem carefully before committing to an approach.</>
      },
      {
        id: "6",
        name: "Concept 6 — Absolute Value Properties for Comparison Questions",
        tagline: "|x| is always ≥ 0. That one fact unlocks a lot of sign-reasoning without any computation.",
        trigger: <>See a product involving |x| that is negative? → Since |x| is never negative, the <em>other factor</em> must be negative. Example: <em>|x|(y) &lt; 0</em> tells you immediately that <em>y &lt; 0</em> (since |x| ≥ 0, and the product is negative, y must supply the negative sign).<br/><br/>Also useful: <em>|x| ≥ x</em> always, with equality only when <em>x ≥ 0</em>. And <em>|x| + |y| ≥ |x + y|</em> (triangle inequality — the sum of distances is at least the combined distance).</>,
        shortcut: <>On QC questions about expressions involving |x|: test x = positive value and x = negative value of the same magnitude. Absolute values eat the sign, so testing both polarities quickly reveals whether the comparison is always true or sometimes flips.</>,
        trap: <>Watch out: assuming |x| = x. This is only true when x is non-negative. When x is negative, |x| = −x (which is a positive number). For example, if x = −5, then |x| = 5, not −5. Students who conflate |x| and x get QC problems wrong consistently.</>
      }
    ],
    frequency: [
      { rank: "#1 · Highest", content: <><strong>Absolute Value Inequalities</strong> — both flavors (&lt; and &gt;) appear in standard multiple-choice and Quantitative Comparison questions alike. Knowing the two rules cold — "less than = sandwich, greater than = outside" — covers roughly a third of this entire problem set.</> },
      { rank: "#2", content: <><strong>Quantitative Comparison under Inequality Constraints</strong> — you're given a condition (like <em>|x|(y) &lt; 0</em> or <em>a/b &gt; 0</em>) and asked to compare two quantities. The answer is very frequently (D) "Cannot be determined," because the variable can take multiple valid values giving different orderings. Always test extreme or opposite cases before committing to A or B.</> },
      { rank: "#3", content: <><strong>Absolute Value Equations</strong> — straightforward once you know the split, but dangerous in "indicate all that apply" format, which is designed to catch students who find only one of the two solutions. Always solve both cases.</> }
    ],
    examples: [
      {
        id: "1",
        title: "Example 1 · Q1 in the PDF",
        question: <>Given <em>|3x − 18| = 9</em>.<br/>Quantity A = x &nbsp;·&nbsp; Quantity B = 6.<br/>Which is greater?</>,
        steps: [
          <><em>The move:</em> Absolute value equation → split into two cases.</>,
          <><strong>Case 1 (positive):</strong> <em>3x − 18 = 9</em> → <em>3x = 27</em> → <em>x = 9</em></>,
          <><strong>Case 2 (negative):</strong> <em>3x − 18 = −9</em> → <em>3x = 9</em> → <em>x = 3</em></>,
          <>x = 9 makes Quantity A bigger than 6. x = 3 makes Quantity A smaller than 6. Since x has two valid values that give opposite outcomes, the answer is <strong>(D) Cannot be determined.</strong></>
        ],
        takeaway: <>Whenever an absolute value equation yields two solutions, and a QC question asks you to compare, immediately suspect (D). Two valid solutions that produce different orderings = cannot be determined. This is the most common QC outcome in absolute value problems.</>
      },
      {
        id: "2",
        title: "Example 2 · Q2 in the PDF",
        question: <>If <em>2z + 4 ≥ −18</em>, which of the following must be true?<br/>(A) z ≤ −11 &nbsp;&nbsp; (B) z ≤ 11 &nbsp;&nbsp; (C) z ≥ −11 &nbsp;&nbsp; (D) z ≥ −7 &nbsp;&nbsp; (E) z ≥ 7</>,
        steps: [
          <><em>The move:</em> Solve the inequality. No negative to divide by here, so no flip needed.</>,
          <><em>2z + 4 ≥ −18</em> → <em>2z ≥ −22</em> → <em>z ≥ −11</em></>,
          <>Answer is (C). Why not (D) z ≥ −7? Because z = −10 satisfies our constraint (−10 ≥ −11 ✓) but does NOT satisfy z ≥ −7. Choice (D) would exclude valid values — so it cannot "must be true."</>
        ],
        takeaway: <>For "must be true" questions, your answer must admit ALL valid solutions. A stricter constraint (like z ≥ −7 instead of z ≥ −11) excludes valid values and is wrong. The correct answer is the weakest statement that still holds for every valid value.</>
      },
      {
        id: "3",
        title: "Example 3 · Q21 in the PDF",
        question: <>If <em>|3x + 7| ≥ 2x + 12</em>, which of the following is true?<br/>(D) <em>x ≤ −19/5 &nbsp; or &nbsp; x ≥ 5</em></>,
        steps: [
          <><em>The move:</em> <em>|expr| ≥ k</em> → apply the "outside" rule. Two separate cases.</>,
          <><strong>Case 1 (positive side):</strong> <em>3x + 7 ≥ 2x + 12</em> → <em>x ≥ 5</em></>,
          <><strong>Case 2 (negative side):</strong> <em>3x + 7 ≤ −(2x + 12)</em> → <em>3x + 7 ≤ −2x − 12</em> → <em>5x ≤ −19</em> → <em>x ≤ −19/5</em></>,
          <>The answer is two disconnected outer ranges — exactly the "beyond" picture for a "greater than" absolute value inequality.</>
        ],
        takeaway: <><em>|expr| ≥ k</em> always produces two separate ranges pointing away from zero. If your answer after solving is a single connected middle range, you almost certainly applied the wrong rule — go back and check.</>
      },
      {
        id: "4",
        title: "Example 4 · Q9 in the PDF — the Sign-Flip Trap",
        question: <>If <em>y &lt; 0</em> and <em>4x &gt; y</em>, which of the following could equal <em>x/y</em>?</>,
        steps: [
          <><em>The move:</em> We need to isolate <em>x/y</em>. Divide both sides of <em>4x &gt; y</em> by y.</>,
          <>y is negative (given) → dividing by a negative → <strong>flip the sign.</strong></>,
          <><em>4x/y &lt; 1</em> → so <em>x/y &lt; 1/4</em>, meaning x/y must be less than 0.25.</>,
          <>Any answer choice below 0.25 is valid — including negative values (which are perfectly fine).</>
        ],
        takeaway: <>The instant the problem tells you a variable is negative and you divide by it, flip the inequality sign. This is the single most tested trap in the entire chapter. No calculation is needed — just the one rule, applied consciously.</>
      }
    ],
    checklist: {
      intro: "Follow these steps in order. No panic required.",
      items: [
        <><strong>Identify what type of expression you have.</strong> Is there an absolute value? Is the symbol = or &lt; or &gt;? These two observations alone tell you which of the five tools to reach for before you write a single thing.</>,
        <><strong>If you see absolute value bars, immediately ask: equation or inequality?</strong><ul className="mt-2 pl-4 list-disc space-y-1"><li>Equation (= k) → split into two cases: +k and −k. Solve both.</li><li>Inequality &lt; k → sandwich rule: <em>−k &lt; expr &lt; k</em>.</li><li>Inequality &gt; k → outside rule: <em>expr &gt; k</em> or <em>expr &lt; −k</em>.</li></ul></>,
        <><strong>Before you multiply or divide, check your multiplier.</strong> Is it a known negative number? Flip the sign. Is it an unknown variable? Pause — does the problem tell you its sign? If not, handle it without dividing.</>,
        <><strong>For Quantitative Comparison questions:</strong> after finding the valid range, test two values — one that gives A bigger, one that gives B bigger. If you find both, stop: the answer is (D) immediately.</>,
        <><strong>Verify with a number.</strong> Pick a value inside your answer range and check it satisfies the original expression. This takes 15 seconds and catches almost every algebra slip.</>
      ],
      encouragement: <>Here's the honest reassurance: most questions in this chapter reduce to <em>one</em> of two or three moves. You're not memorizing a large toolkit — you're recognizing which small move applies and executing it cleanly. The GRE is designed so that logical reasoning beats brute-force arithmetic every time. You don't have to be a "math person" to do well here. You need to be careful, systematic, and willing to test your answer. That's it.</>
    },
    isStudied: false
  }
];
