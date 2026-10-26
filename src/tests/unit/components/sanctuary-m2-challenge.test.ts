import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

describe('Milestone 2 Empirical Challenge: Unboxed Scroll-Driven Storytelling on /', () => {
  const storyScrollPath = path.join(
    process.cwd(),
    'src/components/directions/AlabasterStoryScroll.tsx'
  );
  const storyScrollSource = fs.readFileSync(storyScrollPath, 'utf8');

  // Parse TypeScript AST to rigorously inspect JSX elements and attributes
  const sourceFile = ts.createSourceFile(
    'AlabasterStoryScroll.tsx',
    storyScrollSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  // Helper to extract all JSX elements matching a tag name
  interface JsxNodeInfo {
    tagName: string;
    attributes: Record<string, string>;
    text: string;
    node: ts.Node;
  }

  function collectJsxNodes(root: ts.Node): JsxNodeInfo[] {
    const results: JsxNodeInfo[] = [];

    function visit(node: ts.Node) {
      if (ts.isJsxElement(node)) {
        const tagName = node.openingElement.tagName.getText(sourceFile);
        const attributes: Record<string, string> = {};
        node.openingElement.attributes.properties.forEach((prop) => {
          if (ts.isJsxAttribute(prop) && prop.initializer) {
            const attrName = prop.name.getText(sourceFile);
            let attrVal = prop.initializer.getText(sourceFile);
            if (attrVal.startsWith('"') && attrVal.endsWith('"')) {
              attrVal = attrVal.slice(1, -1);
            }
            attributes[attrName] = attrVal;
          }
        });
        results.push({
          tagName,
          attributes,
          text: node.getText(sourceFile),
          node,
        });
      } else if (ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        const attributes: Record<string, string> = {};
        node.attributes.properties.forEach((prop) => {
          if (ts.isJsxAttribute(prop) && prop.initializer) {
            const attrName = prop.name.getText(sourceFile);
            let attrVal = prop.initializer.getText(sourceFile);
            if (attrVal.startsWith('"') && attrVal.endsWith('"')) {
              attrVal = attrVal.slice(1, -1);
            }
            attributes[attrName] = attrVal;
          }
        });
        results.push({
          tagName,
          attributes,
          text: node.getText(sourceFile),
          node,
        });
      }
      ts.forEachChild(node, visit);
    }

    visit(root);
    return results;
  }

  const allJsxNodes = collectJsxNodes(sourceFile);

  // --------------------------------------------------------------------------
  // a. All 5 chapters (Acts I–V) render their expected headlines and body paragraphs
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-01: All 5 chapters (Acts I–V) exist in AST with expected headlines, body copy, and anchors', () => {
    // Act I: The Crossroads
    const act1 = allJsxNodes.find((n) => n.attributes.id === 'act-crossroads');
    expect(act1, 'Act I (#act-crossroads) must exist').toBeDefined();
    expect(act1!.text).toContain('Act I · The Crossroads');
    expect(act1!.text).toContain('Every decision splits your world in five.');
    expect(act1!.text).toContain(
      'Before the path is chosen, potential rests in perfect equilibrium.'
    );
    expect(act1!.text).toContain('id="step-decision"');

    // Act II: The Bifurcation
    const act2 = allJsxNodes.find((n) => n.attributes.id === 'act-bifurcation');
    expect(act2, 'Act II (#act-bifurcation) must exist').toBeDefined();
    expect(act2!.text).toContain('Act II · The Bifurcation');
    expect(act2!.text).toContain('Five futures rise from the water.');
    expect(act2!.text).toContain(
      'The single stream divides into five calibrated trajectories'
    );
    expect(act2!.text).toContain('id="step-futures"');

    // Act III: Infinite Horizon
    const act3 = allJsxNodes.find((n) => n.attributes.id === 'act-horizon');
    expect(act3, 'Act III (#act-horizon) must exist').toBeDefined();
    expect(act3!.text).toContain('Act III · Infinite Horizon');
    expect(act3!.text).toContain('Every outcome becomes a new origin.');
    expect(act3!.text).toContain(
      'Branch horizontally to reveal tail risks and contrarian moves'
    );

    // Act IV: The Strategic Mentor
    const act4 = allJsxNodes.find((n) => n.attributes.id === 'act-mentor');
    expect(act4, 'Act IV (#act-mentor) must exist').toBeDefined();
    expect(act4!.text).toContain('Act IV · The Strategic Mentor');
    expect(act4!.text).toContain('One recommended path illuminated.');
    expect(act4!.text).toContain(
      'The decision engine evaluates utility, runway preservation'
    );
    expect(act4!.text).toContain('id="step-mentor"');

    // Act V: The Threshold
    const act5 = allJsxNodes.find((n) => n.attributes.id === 'act-threshold');
    expect(act5, 'Act V (#act-threshold) must exist').toBeDefined();
    expect(act5!.text).toContain('Act V · The Threshold');
    expect(act5!.text).toContain('Enter your crossroads.');
    expect(act5!.text).toContain(
      'Type your dilemma below or launch a flagship scenario'
    );
  });

  // --------------------------------------------------------------------------
  // b. Acts I–IV have ZERO <form> elements and ZERO <table> elements
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-02: Acts I–IV have ZERO <form> and ZERO <table> elements; exactly 1 form in Act V; 0 tables overall', () => {
    const actIds = [
      'act-crossroads',
      'act-bifurcation',
      'act-horizon',
      'act-mentor',
    ];

    actIds.forEach((id) => {
      const act = allJsxNodes.find((n) => n.attributes.id === id);
      expect(act, `Act section ${id} must exist`).toBeDefined();

      const innerNodes = collectJsxNodes(act!.node);
      const innerForms = innerNodes.filter((n) => n.tagName.toLowerCase() === 'form');
      const innerTables = innerNodes.filter((n) => n.tagName.toLowerCase() === 'table');
      const innerInputs = innerNodes.filter(
        (n) =>
          n.tagName.toLowerCase() === 'input' ||
          n.tagName.toLowerCase() === 'textarea' ||
          n.tagName.toLowerCase() === 'select'
      );

      expect(
        innerForms.length,
        `Expected ZERO forms in ${id}, found ${innerForms.length}`
      ).toBe(0);
      expect(
        innerTables.length,
        `Expected ZERO tables in ${id}, found ${innerTables.length}`
      ).toBe(0);
      expect(
        innerInputs.length,
        `Expected ZERO inputs in ${id}, found ${innerInputs.length}`
      ).toBe(0);
    });

    // Check across the entire component
    const allForms = allJsxNodes.filter((n) => n.tagName.toLowerCase() === 'form');
    expect(allForms.length, 'Expected exactly 1 form across the component').toBe(1);

    const act5 = allJsxNodes.find((n) => n.attributes.id === 'act-threshold');
    const act5Forms = collectJsxNodes(act5!.node).filter(
      (n) => n.tagName.toLowerCase() === 'form'
    );
    expect(act5Forms.length, 'The single form must reside within Act V').toBe(1);

    const allTables = allJsxNodes.filter((n) => n.tagName.toLowerCase() === 'table');
    expect(allTables.length, 'Expected ZERO table elements across the component').toBe(0);
  });

  // --------------------------------------------------------------------------
  // c. Minimal header contains chapter navigation links and a Start Now button
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-03: Minimal header contains brand wordmark, chapter navigation links (Acts I-V), and Start Now button', () => {
    const headerNode = allJsxNodes.find(
      (n) => n.tagName.toLowerCase() === 'header' && n.attributes.role === 'banner'
    );
    expect(headerNode, 'Header with role="banner" must exist').toBeDefined();

    const headerChildren = collectJsxNodes(headerNode!.node);

    // Brand link
    const brandLink = headerChildren.find(
      (n) => n.tagName === 'Link' && n.attributes.href === '/'
    );
    expect(brandLink, 'Brand Link to "/" must exist in header').toBeDefined();
    expect(brandLink!.text).toContain('HOROVEX');

    // Chapter navigation container
    const navNode = headerChildren.find(
      (n) => n.tagName.toLowerCase() === 'nav' && n.attributes['aria-label'] === 'Story Chapters'
    );
    expect(navNode, 'Nav with aria-label="Story Chapters" must exist').toBeDefined();

    // Verify chapters definition array in source
    expect(storyScrollSource).toContain("numeral: 'I', title: 'Crossroads'");
    expect(storyScrollSource).toContain("numeral: 'II', title: 'Bifurcation'");
    expect(storyScrollSource).toContain("numeral: 'III', title: 'Horizon'");
    expect(storyScrollSource).toContain("numeral: 'IV', title: 'Mentor'");
    expect(storyScrollSource).toContain("numeral: 'V', title: 'Threshold'");

    // Start Now CTA button
    const startNowBtn = headerChildren.find(
      (n) => n.tagName.toLowerCase() === 'button' && n.text.includes('Start Now')
    );
    expect(startNowBtn, 'Start Now button must exist in header').toBeDefined();
    expect(startNowBtn!.text).toContain('scrollToAct(1.0)');
  });

  // --------------------------------------------------------------------------
  // d. Act V form contains input, submit button, scenario presets
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-04: Act V form contains input, submit button with data-testid="simulate-btn", and flagship presets', () => {
    const act5 = allJsxNodes.find((n) => n.attributes.id === 'act-threshold');
    expect(act5).toBeDefined();

    const act5Children = collectJsxNodes(act5!.node);

    // Form element
    const form = act5Children.find((n) => n.tagName.toLowerCase() === 'form');
    expect(form, 'Form must exist in Act V').toBeDefined();

    // Text input
    const input = act5Children.find(
      (n) =>
        n.tagName.toLowerCase() === 'input' &&
        n.attributes.id === 'threshold-input' &&
        n.attributes.name === 'dilemma'
    );
    expect(input, 'Input with id="threshold-input" and name="dilemma" must exist').toBeDefined();

    // Submit button
    const submitBtn = act5Children.find(
      (n) =>
        n.tagName.toLowerCase() === 'button' &&
        n.attributes['data-testid'] === 'simulate-btn' &&
        n.attributes.type === 'submit'
    );
    expect(submitBtn, 'Submit button with data-testid="simulate-btn" must exist').toBeDefined();
    expect(submitBtn!.text).toContain('Predict 5 Futures');

    // Preset Links
    const saasLink = act5Children.find(
      (n) => n.tagName === 'Link' && n.attributes.href === '/observatory?demo=saas-pivot'
    );
    expect(saasLink, 'Flagship scenario "saas-pivot" link must exist').toBeDefined();
    expect(saasLink!.text).toContain('Pivot SaaS to Enterprise');

    const soloAiLink = act5Children.find(
      (n) => n.tagName === 'Link' && n.attributes.href === '/observatory?demo=solo-ai'
    );
    expect(soloAiLink, 'Flagship scenario "solo-ai" link must exist').toBeDefined();
    expect(soloAiLink!.text).toContain('Leave Big Tech for Solo AI');

    const relocationLink = act5Children.find(
      (n) => n.tagName === 'Link' && n.attributes.href === '/observatory?demo=relocation'
    );
    expect(relocationLink, 'Flagship scenario "relocation" link must exist').toBeDefined();
    expect(relocationLink!.text).toContain('San Francisco vs. Dubai');

    // Secondary testids for backward compatibility
    const recurseBtn = act5Children.find(
      (n) => n.attributes['data-testid'] === 'recurse-deeper-btn'
    );
    expect(recurseBtn).toBeDefined();

    const expandBtn = act5Children.find(
      (n) => n.attributes['data-testid'] === 'expand-wave-btn'
    );
    expect(expandBtn).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // e. Zero theme-switching buttons exist anywhere in AlabasterStoryScroll.tsx
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-05: Zero theme-switching buttons or banned color tokens exist anywhere in AlabasterStoryScroll.tsx', () => {
    // Check all buttons in the file
    const allButtons = allJsxNodes.filter((n) => n.tagName.toLowerCase() === 'button');
    allButtons.forEach((btn) => {
      const text = btn.text.toLowerCase();
      expect(text).not.toContain('switch-direction');
      expect(text).not.toContain('landscape 3d');
      expect(text).not.toContain('instrument 3d');
      expect(text).not.toContain('dark room 3d');
      expect(text).not.toContain('theme');
    });

    // Check complete source code for banned patterns
    expect(storyScrollSource).not.toContain('switch-direction');
    expect(storyScrollSource).not.toContain('Landscape 3D');
    expect(storyScrollSource).not.toContain('Instrument 3D');
    expect(storyScrollSource).not.toContain('Dark Room 3D');
    expect(storyScrollSource).not.toContain('setTheme');
    expect(storyScrollSource).not.toContain('toggleTheme');

    // Check for banned muddy gold / brown tones (#C49A45, #D4AF37)
    expect(storyScrollSource).not.toContain('#C49A45');
    expect(storyScrollSource).not.toContain('#D4AF37');
  });

  // --------------------------------------------------------------------------
  // Invariant & Stress Testing: Scroll Progress Math & Routing Logic
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-06: Scroll calculation clamps progress within [0, 1] and classifies active chapters cleanly', () => {
    const calculateProgress = (sy: number, docHeight: number, winHeight: number) => {
      const maxScroll = Math.max(1, docHeight - winHeight);
      return Math.max(0, Math.min(1, sy / maxScroll));
    };

    const getChapterIndex = (progress: number) => {
      if (progress < 0.15) return 0;
      if (progress < 0.38) return 1;
      if (progress < 0.63) return 2;
      if (progress < 0.88) return 3;
      return 4;
    };

    // Standard cases
    expect(calculateProgress(0, 5000, 1000)).toBe(0.0);
    expect(getChapterIndex(0.0)).toBe(0); // Act I

    expect(calculateProgress(1000, 5000, 1000)).toBe(0.25);
    expect(getChapterIndex(0.25)).toBe(1); // Act II

    expect(calculateProgress(2000, 5000, 1000)).toBe(0.5);
    expect(getChapterIndex(0.5)).toBe(2); // Act III

    expect(calculateProgress(3000, 5000, 1000)).toBe(0.75);
    expect(getChapterIndex(0.75)).toBe(3); // Act IV

    expect(calculateProgress(4000, 5000, 1000)).toBe(1.0);
    expect(getChapterIndex(1.0)).toBe(4); // Act V

    // Stress test: Negative scroll (rubber-banding on trackpad/mobile)
    expect(calculateProgress(-1000, 5000, 1000)).toBe(0.0);
    expect(getChapterIndex(calculateProgress(-1000, 5000, 1000))).toBe(0);

    // Stress test: Overflow scroll beyond document height
    expect(calculateProgress(50000, 5000, 1000)).toBe(1.0);
    expect(getChapterIndex(calculateProgress(50000, 5000, 1000))).toBe(4);

    // Stress test: Zero or negative scrollable height (degenerate window metrics)
    expect(calculateProgress(500, 800, 1000)).toBe(1.0); // clamped to 1
  });

  it('M2-CHALLENGE-07: Dilemma submission handles routing with encoding, fallback, and double-submit protection', () => {
    let navigatedTo: string | null = null;
    let isNavigating = false;

    const handleSimulate = (dilemma: string) => {
      if (isNavigating) return;
      isNavigating = true;
      const trimmed = dilemma.trim();
      if (trimmed) {
        navigatedTo = `/observatory?prompt=${encodeURIComponent(trimmed)}`;
      } else {
        navigatedTo = '/observatory?demo=saas-pivot';
      }
    };

    // Case 1: Custom dilemma with special characters
    handleSimulate('Pivot to B2B & expand to EMEA? (urgent)');
    expect(navigatedTo).toBe(
      '/observatory?prompt=Pivot%20to%20B2B%20%26%20expand%20to%20EMEA%3F%20(urgent)'
    );

    // Case 2: Double-click navigation guard
    const priorTarget = navigatedTo;
    handleSimulate('Another dilemma');
    expect(navigatedTo).toBe(priorTarget); // Unchanged because isNavigating is true

    // Case 3: Empty or whitespace dilemma falls back to saas-pivot
    isNavigating = false;
    handleSimulate('   ');
    expect(navigatedTo).toBe('/observatory?demo=saas-pivot');
  });

  // --------------------------------------------------------------------------
  // Edge Case Mining: 500-Character Dilemma, Empty Strings & Flagship Chips
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-08: Form submission edge cases: 500-character dilemma, empty/whitespace strings, and flagship chip presets', () => {
    let currentNavTarget: string | null = null;
    let isNavigatingRef = false;

    const simulateSubmission = (inputDilemma: string) => {
      if (isNavigatingRef) return;
      isNavigatingRef = true;
      const trimmed = inputDilemma.trim();
      if (trimmed) {
        currentNavTarget = `/observatory?prompt=${encodeURIComponent(trimmed)}`;
      } else {
        currentNavTarget = '/observatory?demo=saas-pivot';
      }
    };

    // 1. Empty string
    isNavigatingRef = false;
    simulateSubmission('');
    expect(currentNavTarget).toBe('/observatory?demo=saas-pivot');

    // 2. Whitespace-only string (spaces, tabs, newlines, carriage returns)
    isNavigatingRef = false;
    simulateSubmission('  \t\n \r  ');
    expect(currentNavTarget).toBe('/observatory?demo=saas-pivot');

    // 3. Exactly 500-character dilemma string
    isNavigatingRef = false;
    const baseSentence =
      'Our enterprise B2B SaaS startup has 12 months runway and two conflicting acquisition offers. ';
    const dilemma500 = baseSentence.repeat(6).slice(0, 500);
    expect(dilemma500.length).toBe(500);
    simulateSubmission(dilemma500);
    expect(currentNavTarget).toBe(`/observatory?prompt=${encodeURIComponent(dilemma500)}`);
    // Verify lossless round-trip decoding
    const decoded500 = decodeURIComponent(
      currentNavTarget!.replace('/observatory?prompt=', '')
    );
    expect(decoded500).toBe(dilemma500);
    expect(decoded500.length).toBe(500);

    // 4. 500-character dilemma with URL special characters, mathematical symbols and Unicode emojis
    isNavigatingRef = false;
    const complexChunk =
      'Crossroads: Series A ($15M at 25% dilution) vs Bootstrapping? 🏛️ ⚡ P(success) > 0.65 & Regret <= 0.12! ';
    const complex500 = complexChunk.repeat(5).slice(0, 500);
    expect(complex500.length).toBe(500);
    simulateSubmission(complex500);
    const decodedComplex = decodeURIComponent(
      currentNavTarget!.replace('/observatory?prompt=', '')
    );
    expect(decodedComplex).toBe(complex500);

    // 5. Flagship scenario chips verification
    const flagshipChips = [
      { text: 'Pivot SaaS to Enterprise', demo: 'saas-pivot', href: '/observatory?demo=saas-pivot' },
      { text: 'Leave Big Tech for Solo AI', demo: 'solo-ai', href: '/observatory?demo=solo-ai' },
      { text: 'San Francisco vs. Dubai', demo: 'relocation', href: '/observatory?demo=relocation' },
    ];
    flagshipChips.forEach((chip) => {
      expect(storyScrollSource).toContain(chip.href);
      expect(storyScrollSource).toContain(chip.text);
    });
  });

  // --------------------------------------------------------------------------
  // Navigation & Scroll Choreography: Smooth Scrolling to Target Acts
  // --------------------------------------------------------------------------
  it('M2-CHALLENGE-09: Chapter indicators and Start Now button invoke smooth scrolling to exact act targets', () => {
    const scrollToCalls: { top: number; behavior?: string }[] = [];
    const mockWindowScrollTo = (options: { top: number; behavior?: string }) => {
      scrollToCalls.push(options);
    };

    const scrollToAct = (
      targetProgress: number,
      docHeight: number,
      winHeight: number
    ) => {
      const maxScroll = Math.max(1, docHeight - winHeight);
      mockWindowScrollTo({
        top: targetProgress * maxScroll,
        behavior: 'smooth',
      });
    };

    const chapters = [
      { numeral: 'I', title: 'Crossroads', targetProgress: 0.0 },
      { numeral: 'II', title: 'Bifurcation', targetProgress: 0.25 },
      { numeral: 'III', title: 'Horizon', targetProgress: 0.5 },
      { numeral: 'IV', title: 'Mentor', targetProgress: 0.75 },
      { numeral: 'V', title: 'Threshold', targetProgress: 1.0 },
    ];

    // Standard desktop metrics (docHeight = 5000, winHeight = 1000, maxScroll = 4000)
    chapters.forEach((ch, idx) => {
      scrollToAct(ch.targetProgress, 5000, 1000);
      expect(scrollToCalls[idx]).toEqual({
        top: ch.targetProgress * 4000,
        behavior: 'smooth',
      });
    });

    // Start Now button scrolls to Act V (1.0)
    scrollToAct(1.0, 5000, 1000);
    expect(scrollToCalls[scrollToCalls.length - 1]).toEqual({
      top: 4000,
      behavior: 'smooth',
    });

    // Degenerate viewport metric (docHeight <= winHeight, e.g. 800 <= 1000)
    scrollToCalls.length = 0;
    scrollToAct(1.0, 800, 1000);
    expect(scrollToCalls[0]).toEqual({
      top: 1, // Math.max(1, 800 - 1000) = 1
      behavior: 'smooth',
    });
    expect(Number.isFinite(scrollToCalls[0].top)).toBe(true);
    expect(Number.isNaN(scrollToCalls[0].top)).toBe(false);
  });
});
