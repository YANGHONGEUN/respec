"use strict";

import { flushIframes, makeRSDoc, makeStandardOps } from "../SpecHelper.js";
import { clearXrefData } from "../../../src/core/xref-db.js";

describe("Core - WebIDL", () => {
  afterAll(flushIframes);
  /** @type {Document} */
  let doc;
  beforeAll(async () => {
    const ops = makeStandardOps({ xref: true });
    doc = await makeRSDoc(ops, "tests/spec/core/webidl.html");
  });

  beforeEach(async () => {
    // clear idb cache before each
    await clearXrefData();
  });

  describe("records", () => {
    it("handles record types", async () => {
      const body = `
        <section id="records">
          <h2>Testing records</h2>
          <pre class="idl">
            dictionary Foo {
              record&lt;DOMString, USVString> pass;
            };
          </pre>
        </section>
      `;
      const ops = makeStandardOps(null, body);
      const doc = await makeRSDoc(ops);
      const idl = doc.querySelector("#records pre");
      expect(idl).toBeTruthy(idl);
      expect(idl.querySelector(".idlType:first-child").textContent).toBe(
        "\n  record<DOMString, USVString>"
      );
      expect(idl.querySelector(".idlMember .idlName").textContent).toBe("pass");
    });
  });

  describe("linking", () => {
    it("links standardized IDL types to WebIDL spec", async () => {
      const body = `
        <section id="linkToIDLSpec">
          <h2>Linking to WebIDL spec</h2>
          <pre class="idl">
          [Constructor(sequence&lt;DOMString> methodData), SecureContext]
          interface LinkingTest {
            readonly attribute DOMString? aBoolAttribute;
            Promise&lt;void> returnsPromise(unsigned long long argument);
          };
          </pre>
          <p data-dfn=for="LinkingTest">
            <dfn>aBoolAttribute</dfn>
            <dfn>returnsPromise</dfn>
          </p>
        </section>
      `;
      const ops = makeStandardOps(null, body);
      const doc = await makeRSDoc(ops);
      const idl = doc.querySelector("#linkToIDLSpec pre");
      // [Constructor(sequence<DOMString> methodData), SecureContext]
      const sequences = idl.querySelectorAll(`a[href$="#idl-sequence"]`);
      expect(sequences.length).toBe(1);
      const sequence = sequences[0];

      // sequence<DOMString>
      expect(sequence.nextElementSibling.localName).toBe("a");
      expect(sequence.nextElementSibling.hash).toBe("#idl-DOMString");

      // readonly attribute DOMString? aBoolAttribute;
      const domString = idl.querySelector(".idlAttribute a");
      expect(domString.textContent).toBe("DOMString");
      expect(new URL(domString.getAttribute("href")).hash).toBe(
        "#idl-DOMString"
      );

      // Promise&lt;void> returnsPromise(unsigned long long argument);
      const [promiseLink, voidLink, unsignedLongLink] = idl.querySelectorAll(
        "*[data-title='returnsPromise'] a"
      );
      // Promise
      expect(promiseLink.textContent).toBe("Promise");
      expect(promiseLink.href.endsWith("#idl-promise")).toBe(true);

      // void type of promise
      expect(voidLink.textContent).toBe("void");
      expect(voidLink.href.endsWith("#idl-void")).toBe(true);

      // unsigned long long argument
      expect(unsignedLongLink.textContent).toBe("unsigned long long");
      expect(unsignedLongLink.href.endsWith("#idl-unsigned-long-long")).toBe(
        true
      );
    });
  });

  it("distinguishes between types and identifiers when linking", async () => {
    const similarlyNamedInterface = doc.getElementById(
      "idl-def-similarlynamed"
    );
    expect(similarlyNamedInterface).toBeTruthy();
    const [
      // attribute TestInterface testInterface;
      testInterface,
      // attribute TestCBInterface testCBInterface;
      testCBInterface,
      // attribute TestDictionary testDictionary;
      testDictionary,
      // attribute TestEnum testEnum;
      testEnum,
      // attribute TestTypedef testTypedef;
      testTypedef,
      // readonly maplike<SimilarlyNamed, SimilarlyNamed>;
      mapLike,
    ] = similarlyNamedInterface.querySelectorAll(".idlAttribute, .idlMaplike");
    const typeQuery = "span.idlType a";
    const nameQuery = "a.idlName";
    // attribute TestInterface testInterface;
    expect(testInterface.querySelector(typeQuery).getAttribute("href")).toBe(
      "#dom-testinterface"
    );
    expect(testInterface.querySelector(nameQuery).getAttribute("href")).toBe(
      "#dom-similarlynamed-testinterface"
    );
    // attribute TestCBInterface testCBInterface;
    expect(testCBInterface.querySelector(typeQuery).getAttribute("href")).toBe(
      "#dom-testcbinterface"
    );
    expect(testCBInterface.querySelector(nameQuery).getAttribute("href")).toBe(
      "#dom-similarlynamed-testcbinterface"
    );
    // attribute TestDictionary testDictionary;
    expect(testDictionary.querySelector(typeQuery).getAttribute("href")).toBe(
      "#dom-testdictionary"
    );
    expect(testDictionary.querySelector(nameQuery).getAttribute("href")).toBe(
      "#dom-similarlynamed-testdictionary"
    );
    // attribute TestTypedef testTypedef;
    expect(testEnum.querySelector(typeQuery).getAttribute("href")).toBe(
      "#dom-testenum"
    );
    expect(testEnum.querySelector(nameQuery).getAttribute("href")).toBe(
      "#dom-similarlynamed-testenum"
    );
    // attribute TestTypedef testTypedef;
    expect(testTypedef.querySelector(typeQuery).getAttribute("href")).toBe(
      "#dom-testtypedef"
    );
    expect(testTypedef.querySelector(nameQuery).getAttribute("href")).toBe(
      "#dom-similarlynamed-testtypedef"
    );
    // readonly maplike<SimilarlyNamed, SimilarlyNamed>;
    expect(
      Array.from(mapLike.querySelectorAll("a.internalDFN")).every(
        a => a.getAttribute("href") === "#dom-similarlynamed"
      )
    ).toBeTruthy();
  });

  it("links to fully qualified method names", () => {
    const t1 = new URL(doc.getElementById("fullyQualifiedNoParens-1").href)
      .hash;
    expect(t1).toBe("#dom-parenthesistest-fullyqualifiednoparens");

    const t2 = new URL(doc.getElementById("fullyQualifiedNoParens-2").href)
      .hash;
    expect(t2).toBe("#dom-parenthesistest-fullyqualifiednoparens");

    const t3 = new URL(doc.getElementById("fullyQualifiedNoParens-3").href)
      .hash;
    expect(t3).toBe("#dom-parenthesistest-fullyqualifiednoparens");

    const t4 = new URL(doc.getElementById("fullyQualifiedNoParens-4").href)
      .hash;
    expect(t4).toBe("#dom-parenthesistest-fullyqualifiednoparens");
  });

  it("links simple method names and types", () => {
    const section = doc.getElementById("sec-parenthesis-method");
    ["basic", "ext", "ull", "withName", "named"]
      .map(methodName => [methodName, methodName.toLowerCase()])
      .map(([methodName, id]) => [
        id,
        methodName,
        doc.getElementById(`dom-parenthesistest-${id}`),
      ])
      .forEach(([id, methodName, elem]) => {
        expect(elem).toBeTruthy();
        expect(elem.firstElementChild.localName).toBe("code");
        expect(elem.textContent).toBe(`${methodName}()`);
        expect(elem.id).toBe(`dom-parenthesistest-${id}`);
        expect(elem.dataset.dfnType).toBe("method");
        expect(elem.dataset.dfnFor).toBe("ParenthesisTest");
        expect(elem.dataset.idl).toBe("operation");
        // corresponding link
        const aElem = section.querySelector(
          `pre a[href="#dom-parenthesistest-${id}"]`
        );
        expect(aElem).toBeTruthy();
        expect(aElem.textContent).toBe(methodName);
      });
    const smokeTest = doc.getElementById("dom-parenthesistest-noparens");
    expect(smokeTest).toBeTruthy();
    expect(smokeTest.firstElementChild.localName).toBe("code");
    expect(smokeTest.textContent).toBe("noParens");
    // corresponding link
    const aElem = section.querySelector(
      `pre a[href="#dom-parenthesistest-noparens"]`
    );
    expect(aElem).toBeTruthy();
    expect(aElem.textContent).toBe("noParens");
  });
  it("should handle interfaces", () => {
    let target = doc.getElementById("if-basic");
    let text = "interface SuperStar {};";
    expect(target.textContent).toBe(text);
    expect(target.querySelectorAll(".idlInterface").length).toBe(1);
    expect(target.querySelector(".idlID").textContent).toBe("SuperStar");

    target = doc.getElementById("if-extended-attribute");
    text = `[Something, Constructor()] ${text}`;
    expect(target.textContent).toBe(text);
    const extAttrs = target.querySelectorAll(".extAttr");
    expect(extAttrs[0].textContent).toBe("Something");
    expect(extAttrs[1].textContent).toBe("Constructor()");

    target = doc.getElementById("if-identifier-list");
    text = "[Global=Window, Exposed=(Window,Worker)] interface SuperStar {};";
    const rhs = target.querySelectorAll(".extAttr");
    expect(target.textContent).toBe(text);
    expect(rhs[0].textContent).toBe("Global=Window");
    expect(rhs[1].textContent).toBe("Exposed=(Window,Worker)");

    target = doc.getElementById("if-inheritance");
    text = "interface SuperStar : HyperStar {};";
    expect(target.textContent).toBe(text);
    expect(target.querySelector(".idlSuperclass").textContent).toBe(
      "HyperStar"
    );

    target = doc.getElementById("if-partial");
    text = "partial interface SuperStar {};";
    expect(target.textContent).toBe(text);

    target = doc.getElementById("if-callback");
    text = "callback interface SuperStar {};";
    expect(target.textContent).toBe(text);

    target = doc.getElementById("if-mixin");
    text = "interface mixin SuperStar {};";
    expect(target.textContent).toBe(text);

    target = doc.getElementById("if-partial-mixin");
    text = "partial interface mixin SuperStar {};";
    expect(target.textContent).toBe(text);

    target = doc.getElementById("if-doc");
    const interfaces = target.querySelectorAll(".idlInterface");
    expect(interfaces[0].querySelector("a.idlID").getAttribute("href")).toBe(
      "#dom-docinterface"
    );
    expect(interfaces[1].querySelector("a.idlID")).toBeNull();
    expect(interfaces[0].id).toBe("idl-def-docinterface");
    expect(interfaces[1].id).toBe("idl-def-docisnotcasesensitive");
    expect(interfaces[2].id).toBe("idl-def-undocinterface");
    expect(interfaces[2].querySelector("dfn.idlID")).toBeTruthy();
    const namespace = target.querySelector(".idlNamespace");
    expect(namespace.querySelector("a.idlID").getAttribute("href")).toBe(
      "#dom-afterglow"
    );
  });

  it("should handle constructors", () => {
    let target = doc.getElementById("ctor-basic");
    let text =
      "[Something,\n" +
      " Constructor,\n" +
      " Constructor(boolean bar, sequence<double> foo, Promise<double> blah)]\n" +
      "interface SuperStar {};";
    expect(target.textContent).toBe(text);
    const ctors = target.getElementsByClassName("extAttr");
    expect(ctors.length).toBe(3);
    const ctor = ctors[2];
    expect(ctor.querySelector("a").textContent).toBe("Constructor");
    const params = [...ctor.getElementsByClassName("idlType")];
    expect(params.length).toBe(3);
    expect(params.filter(p => p.textContent.includes("sequence")).length).toBe(
      1
    );
    expect(params.filter(p => p.textContent.includes("Promise")).length).toBe(
      1
    );
    expect(params[0].textContent).toBe("boolean");

    target = doc.getElementById("ctor-noea");
    text = "[Constructor] interface SuperStar {};";
    expect(target.textContent).toBe(text);
  });

  it("should handle named constructors", () => {
    const target = doc.getElementById("namedctor-basic");
    const text =
      "[Something,\n" +
      " NamedConstructor=Sun(),\n" +
      " NamedConstructor=Sun(boolean bar, Date foo)]\n" +
      "interface SuperStar {};";
    expect(target.textContent).toBe(text);
    const ctors = target.getElementsByClassName("extAttr");
    expect(ctors.length).toBe(3);
    const ctor = ctors[2];
    expect(ctor.textContent).toBe(
      "NamedConstructor=Sun(boolean bar, Date foo)"
    );
    const params = [...ctor.getElementsByClassName("idlType")];
    expect(params.length).toBe(2);
    expect(params.filter(p => p.textContent.includes("Date")).length).toBe(1);
    expect(params[0].textContent).toBe("boolean");
  });

  it("should handle constants", () => {
    const target = doc.getElementById("const-basic");
    const text =
      "interface ConstTest {\n" +
      "  // 1\n" +
      "  const boolean test = true;\n" +
      "  // 2\n" +
      "  const byte bite = 8;\n" +
      "  // 3\n" +
      "  const octet eight = 7;\n" +
      "  // 4\n" +
      "  const short small = 42;\n" +
      "  // 5\n" +
      "  const unsigned short shortish = 250;\n" +
      "  // 6\n" +
      "  const long notSoLong = 99999;\n" +
      "  // 7\n" +
      "  const unsigned long somewhatLong = 9999999;\n" +
      "  // 8\n" +
      "  const long long veryLong = 9999999999999;\n" +
      "  // 9\n" +
      "  const unsigned long long soLong = 99999999999999999;\n" +
      "  // 10\n" +
      "  const float ationDevice = 4.2;\n" +
      "  // 11\n" +
      "  const unrestricted float buoy = 4.2222222222;\n" +
      "  // 12\n" +
      "  const double twice = 4.222222222;\n" +
      "  // 13\n" +
      "  const unrestricted double rambaldi = 47.0;\n" +
      "  // 14\n" +
      "  const short inf = Infinity;\n" +
      "  // 15\n" +
      "  const short mininf = -Infinity;\n" +
      "  // 16\n" +
      "  const short cheese = NaN;\n" +
      "  // 17\n" +
      "  [Something] const short extAttr = NaN;\n" +
      "};";
    expect(target.textContent).toBe(text);
    const consts = [...target.getElementsByClassName("idlConst")];
    expect(consts.length).toBe(17);
    const const1 = target.querySelector(".idlConst");
    expect(const1.querySelector(".idlType").textContent).toBe(" boolean");
    expect(const1.querySelector(".idlName").textContent).toBe("test");
    expect(consts[consts.length - 1].querySelectorAll(".extAttr").length).toBe(
      1
    );

    // Links and IDs.
    expect(
      consts
        .find(c => c.textContent.includes("rambaldi"))
        .querySelector("a.idlName")
        .getAttribute("href")
    ).toBe("#dom-consttest-rambaldi");
    expect(
      consts.find(c => c.textContent.includes("rambaldi")).getAttribute("id")
    ).toBe("idl-def-consttest-rambaldi");
    expect(
      consts
        .find(c => c.textContent.includes("bite"))
        .querySelector("a.idlName")
        .getAttribute("href")
    ).toBe("#dom-consttest-bite");
    expect(
      consts
        .find(c => c.textContent.includes("inf"))
        .querySelector("a.idlName")
        .getAttribute("href")
    ).toBe("#dom-consttest-inf");
    expect(
      consts
        .find(c => c.textContent.includes("ationDevice"))
        .querySelector("dfn.idlName")
    ).toBeTruthy();
  });

  it("should handle attributes", () => {
    const target = doc.getElementById("attr-basic");
    const text = `interface AttrBasic {
  // 1
  attribute DOMString regular;
  // 2
  readonly attribute DOMString ro;
  // 2.2
  readonly attribute DOMString _readonly;
  // 2.5
  inherit attribute DOMString in;
  // 2.7
  stringifier attribute DOMString st;
  // 3
  [Something] readonly attribute DOMString ext;
  // 3.10.31
  attribute FrozenArray<DOMString> alist;
  // 4.0
  attribute Promise<DOMString> operation;
  // 5.0
  readonly attribute Performance performance;
};`;
    expect(target.textContent).toBe(text);
    const attrs = [...target.getElementsByClassName("idlAttribute")];
    expect(attrs.length).toBe(9);
    const at = attrs[0];
    expect(at.querySelector(".idlType").textContent).toBe(" DOMString");
    expect(at.querySelector(".idlName").textContent).toBe("regular");
    const ro = attrs[2];
    expect(ro.querySelector(".idlName").textContent).toBe("_readonly");
    const frozen = attrs[6];
    expect(frozen.querySelector(".idlType").textContent).toBe(
      " FrozenArray<DOMString>"
    );
    const promise = attrs[7];
    expect(promise.querySelector(".idlType").textContent).toBe(
      " Promise<DOMString>"
    );
    expect(
      attrs.find(c => c.textContent.includes("_readonly")).getAttribute("id")
    ).toBe("idl-def-attrbasic-readonly");
    expect(
      attrs
        .find(c => c.textContent.includes("regular"))
        .querySelector("a.idlName")
        .getAttribute("href")
    ).toBe("#dom-attrbasic-regular");
    expect(
      attrs
        .find(c => c.textContent.includes("alist"))
        .querySelector("dfn.idlName")
    ).toBeTruthy();

    const performanceInterfaceLink = Array.from(
      target.querySelectorAll("a")
    ).find(({ textContent }) => textContent === "Performance");
    expect(performanceInterfaceLink).toBeTruthy();
    expect(performanceInterfaceLink.getAttribute("href")).toBe(
      "#dfn-performance"
    );

    const performanceAttrLink = Array.from(target.querySelectorAll("a")).find(
      ({ textContent }) => textContent === "performance"
    );
    expect(performanceAttrLink).toBeTruthy();
    expect(performanceAttrLink.getAttribute("href")).toBe(
      "#dom-attrbasic-performance"
    );
  });

  it("handles stringifiers special operations", () => {
    const stringifierTestElems = [
      ...doc.querySelectorAll("#stringifiertest .idlMethod"),
    ];
    const [stringifierAnon, stringifierNamed] = stringifierTestElems;
    expect(stringifierAnon).toBeTruthy();
    expect(stringifierAnon.querySelector(".idlType").textContent).toBe(
      " StringPass"
    );
    expect(stringifierAnon.querySelector(".idlName")).toBeNull();

    expect(stringifierNamed).toBeTruthy();
    expect(stringifierNamed.querySelector(".idlType").textContent).toBe(
      " StringNamedPass"
    );
    expect(stringifierNamed.querySelector(".idlName").textContent).toBe(
      "named"
    );
  });

  it("handles getter special operations", () => {
    const getterTestElems = [...doc.querySelectorAll("#gettertest .idlMethod")];
    const [getterAnon, getterNamed] = getterTestElems;
    expect(getterAnon).toBeTruthy();
    expect(getterAnon.querySelector(".idlType").textContent).toBe(
      " GetterPass"
    );
    expect(getterAnon.querySelector(".idlName")).toBeNull();

    expect(getterNamed).toBeTruthy();
    expect(getterNamed.querySelector(".idlType").textContent).toBe(
      " GetterNamedPass"
    );
    expect(getterNamed.querySelector(".idlName").textContent).toBe("named");
  });

  it("handles setter special operations", () => {
    const setterTestElems = [...doc.querySelectorAll("#settertest .idlMethod")];
    const [setterAnon, setterNamed] = setterTestElems;
    expect(setterAnon).toBeTruthy();
    expect(setterAnon.querySelector(".idlType").textContent).toBe(
      " SetterPass"
    );
    expect(setterAnon.querySelector(".idlName")).toBeNull();

    expect(setterNamed).toBeTruthy();
    expect(setterNamed.querySelector(".idlType").textContent).toBe(
      " SetterNamedPass"
    );
    expect(setterNamed.querySelector(".idlName").textContent).toBe("named");
  });

  it("should handle operations", () => {
    const target = doc.getElementById("meth-basic");
    const text = `interface MethBasic {
  // 1
  void basic();
  // 2
  [Something] void ext();
  // 3
  unsigned long long ull(short s, short n);
  // 3.5
  SuperStar? ull();
  // 5
  getter float ();
  // 6
  getter float withName ();
  // 7
  setter void ();
  // 8
  setter void named ();
  // 9
  static Promise<RTCCertificate>  generateCertificate(AlgorithmIdentifier keygenAlgorithm);
  // 10
  stringifier DOMString identifier();
  // 11
  stringifier DOMString ();
  // 12
  stringifier;
  Promise<void> complete(optional PaymentComplete result = "unknown");
  Promise<void> another(optional  /*trivia*/  PaymentComplete result = "unknown");
  Performance performance();
};`;
    expect(target.textContent).toBe(text);
    const methods = [...target.getElementsByClassName("idlMethod")];
    expect(methods.length).toBe(15);
    expect(target.getElementsByClassName("idlName").length).toBe(11);
    const first = methods[0];
    expect(first.querySelector(".idlType").textContent).toBe(
      "\n  // 1\n  void"
    );
    expect(first.querySelector(".idlName").textContent).toBe("basic");
    expect(
      methods
        .find(m => m.textContent.includes("SuperStar?"))
        .querySelector(".idlType a").textContent
    ).toBe("SuperStar");

    // Links and IDs.
    const ulls = methods
      .filter(m => m.textContent.includes("ull"))
      .map(m => m.querySelector("a.idlName").getAttribute("href"));
    expect(ulls[0]).toBe("#dom-methbasic-ull");
    expect(ulls[ulls.length - 1]).toBe("#dom-methbasic-ull!overload-1");
    expect(
      methods
        .find(m => m.textContent.includes("withName"))
        .querySelector("dfn.idlName")
    ).toBeTruthy();

    const performanceTypeLink = Array.from(target.querySelectorAll("a")).find(
      ({ textContent }) => textContent === "Performance"
    );
    expect(performanceTypeLink).toBeTruthy();
    expect(performanceTypeLink.getAttribute("href")).toBe("#dfn-performance");
    const performanceMethodLink = Array.from(target.querySelectorAll("a")).find(
      ({ textContent }) => textContent === "performance"
    );
    expect(performanceMethodLink).toBeTruthy();
    expect(performanceMethodLink.getAttribute("href")).toBe(
      "#dom-methbasic-performance"
    );
  });

  it("should handle iterable-like interface member declarations", () => {
    const elem = doc.getElementById("iterable-like");
    expect(elem.getElementsByClassName("idlIterable").length).toBe(2);
    expect(elem.getElementsByClassName("idlMaplike").length).toBe(1);
    expect(elem.getElementsByClassName("idlSetlike").length).toBe(1);
  });

  it("outputs map/set-like interface member declarations", () => {
    const { textContent } = doc.getElementById("map-set-readonly");
    const expected = `
interface MapLikeInterface {
  maplike<MapLikeInterface, MapLikeInterface>;
};
interface ReadOnlyMapLike {
  readonly maplike<ReadOnlyMapLike, ReadOnlyMapLike>;
};
interface SetLikeInterface {
  setlike<SetLikeInterface>;
};
interface ReadOnlySetLike {
  readonly setlike<ReadOnlySetLike>;
};`.trim();
    expect(textContent).toBe(expected);
  });

  it("should handle comments", () => {
    const target = doc.getElementById("comments-basic");
    const text =
      "interface SuperStar {\n" +
      "  // This is a comment\n" +
      "  // over two lines.\n" +
      "  /* This one\n" +
      "     has\n" +
      "     three. */\n" +
      "  \n" +
      "};";
    expect(target.textContent).toBe(text);
    expect(target.getElementsByClassName("idlSectionComment").length).toBe(1);
  });

  it("should handle dictionaries", () => {
    let target = doc.getElementById("dict-basic");
    let text = "dictionary SuperStar {};";
    expect(target.textContent).toBe(text);
    expect(target.querySelectorAll(".idlDictionary").length).toBe(1);
    expect(target.querySelector(".idlID").textContent).toBe("SuperStar");

    target = doc.getElementById("dict-inherit");
    text = "dictionary SuperStar : HyperStar {};";
    expect(target.textContent).toBe(text);
    expect(target.querySelector(".idlSuperclass").textContent).toBe(
      "HyperStar"
    );

    target = doc.getElementById("dict-fields");
    text =
      "dictionary SuperStar {\n" +
      "  // 1\n" +
      "  DOMString value;\n" +
      "  // 2\n" +
      "  DOMString? nullable;\n" +
      "  // 3\n" +
      "  [Something]float ext;\n" +
      "  // 4\n" +
      "  unsigned long long longLong;\n" +
      "\n" +
      "  // 5\n" +
      "  boolean test = true;\n" +
      "  // 6\n" +
      "  byte little = 2;\n" +
      "  // 7\n" +
      "  byte big = Infinity;\n" +
      "  // 8\n" +
      "  byte cheese = NaN;\n" +
      "  // 9\n" +
      '  DOMString blah = "blah blah";\n' +
      "};";
    expect(target.textContent).toBe(text);
    const members = target.querySelectorAll(".idlMember");
    expect(members.length).toBe(9);
    const member = members[0];
    expect(member.querySelector(".idlType").textContent).toBe(
      "\n  // 1\n  DOMString"
    );
    expect(member.querySelector(".idlName").textContent).toBe("value");

    target = doc.getElementById("dict-required-fields");
    text =
      "dictionary SuperStar {\n" +
      "  required DOMString value;\n" +
      "  DOMString optValue;\n" +
      "};";
    expect(target.textContent).toBe(text);

    // Links and IDs.
    const dictDocTest = doc
      .getElementById("dict-doc")
      .querySelector(".idlDictionary");
    expect(dictDocTest.querySelector("a.idlID").getAttribute("href")).toBe(
      "#dom-dictdoctest"
    );
    expect(dictDocTest.getAttribute("id")).toBe("idl-def-dictdoctest");
    const mems = [...dictDocTest.querySelectorAll(".idlMember")];
    const dictDocField = mems.find(m => m.textContent.includes("dictDocField"));
    expect(dictDocField.querySelector("a.idlName").getAttribute("href")).toBe(
      "#dom-dictdoctest-dictdocfield"
    );
    expect(
      mems
        .find(m => m.textContent.includes("otherField"))
        .querySelector("a.idlName")
        .getAttribute("href")
    ).toBe("#dom-dictdoctest-otherfield");
    expect(dictDocField.getAttribute("id")).toBe(
      "idl-def-dictdoctest-dictdocfield"
    );
    const warningLink = mems
      .find(m => m.textContent.includes("undocField"))
      .querySelector("dfn.idlName");
    expect(warningLink).toBeTruthy();
  });

  it("handles multiple dictionaries", async () => {
    const idl = doc.getElementById("multiple-dictionaries");
    const expected = `
dictionary OneThing {
  int x;
};


partial dictionary AnotherThing {
  int y;
};`.trim();
    expect(idl.textContent).toBe(expected);
    expect(idl.querySelector(".idlSectionComment")).toBeNull();
  });

  it("uniquely links to enum values", () => {
    const target = doc.getElementById("multipleEnums");
    const idlLinks = target.querySelectorAll("a[data-link-for]");
    expect(idlLinks.length).toBe(2);
    const [a1, a2] = idlLinks;
    expect(a1.getAttribute("href")).toBe("#dom-test1-enum");
    expect(a2.getAttribute("href")).toBe("#dom-test2-enum");
    expect(doc.getElementById("dom-test1-enum")).toBeTruthy();
    expect(doc.getElementById("dom-test2-enum")).toBeTruthy();
  });

  describe("enums", () => {
    it("handles enumerations", async () => {
      const body = `
      <section id="enumerations">
        <pre id='enum-basic' class='idl'>
          enum EnumBasic {
            // 1
            "one",
            // 2
            "two"
            // 3
            , "three",

            // 4
            "white space"
          };
        </pre>
        <p id="enum-basic-doc"><dfn>EnumBasic</dfn></p>
        <p data-dfn-for="EnumBasic"><dfn>one</dfn> is first.</p>
        <p data-link-for="EnumBasic"><a>one</a> is referenced with a <code>[link-for]</code> attribute.</p>
        <p id="enum-ref-without-link-for"><a>EnumBasic.one</a> may also be referenced with fully-qualified name.</p>
        <p><dfn data-dfn-for="EnumBasic">white space</dfn></p>
      </section>
      `;
      const ops = makeStandardOps(null, body);
      const doc = await makeRSDoc(ops);
      const target = doc.getElementById("enum-basic");
      const text = `
enum EnumBasic {
  // 1
  "one",
  // 2
  "two"
  // 3
  , "three",

  // 4
  "white space"
}; `.trim();
      expect(target.textContent).toBe(text);
      expect(target.querySelector(".idlEnum")).toBeTruthy();
      expect(target.querySelector(".idlID").textContent).toBe("EnumBasic");
      expect(target.querySelectorAll(".idlEnumItem").length).toBe(4);
      expect(target.querySelector(".idlEnumItem").textContent).toBe('"one"');
      expect(
        target.querySelector("a[href='#dom-enumbasic-white-space']")
      ).toBeTruthy();
      // Links and IDs.
      expect(target.querySelector("a.idlID").getAttribute("href")).toBe(
        "#dom-enumbasic"
      );
      expect(doc.getElementById("idl-def-enumbasic")).toBeTruthy();
    });
  });

  it("should handle enumeration value definitions", () => {
    const section = doc.getElementById("enumerations");
    expect(
      [...section.getElementsByTagName("dfn")]
        .find(el => el.textContent.includes("one"))
        .getAttribute("id")
    ).toBe("dom-enumbasic-one");
    expect(
      [...section.querySelectorAll("p[data-link-for] a")]
        .find(el => el.textContent.includes("one"))
        .getAttribute("href")
    ).toBe("#dom-enumbasic-one");
    expect(
      [...section.querySelectorAll("#enum-ref-without-link-for a")]
        .find(el => el.textContent.includes("one"))
        .getAttribute("href")
    ).toBe("#dom-enumbasic-one");
  });

  it("links empty-string enumeration value", () => {
    const links = doc.querySelector(
      `#enum-empty-sec a[href="#dom-emptyenum-the-empty-string"]`
    );
    const dfn = doc.getElementById("dom-emptyenum-the-empty-string");
    const smokeDfn = doc.querySelector(
      `#enum-empty-sec a[href="#dom-emptyenum-not-empty"]`
    );
    expect(links).toBeTruthy();
    expect(dfn).toBeTruthy();
    expect(smokeDfn).toBeTruthy();
  });

  it("handles optional and trivia", () => {
    const expected = `
[Constructor(X x, optional Y y, /*trivia*/ Z y)]
interface Foo {
  void foo(X x, optional Y y, /*trivia*/ optional Z z);
};
callback CallBack = Z? (X x, optional Y y, /*trivia*/ optional Z z);
    `.trim();
    const idlElem = doc.getElementById("optional-trivia");
    expect(idlElem.textContent).toBe(expected);
    const trivaComments = idlElem.querySelectorAll("span.idlSectionComment");
    expect(trivaComments.length).toBe(3);
  });

  it("should handle callbacks", () => {
    let target = doc.getElementById("cb-basic");
    let text = "callback SuperStar = void();";
    expect(target.textContent).toBe(text);
    expect(target.getElementsByClassName("idlCallback").length).toBe(1);
    expect(target.querySelector(".idlID").textContent).toBe("SuperStar");
    expect(target.querySelector(".idlType").textContent).toBe(" void");

    target = doc.getElementById("cb-less-basic");
    text = "callback CbLessBasic = unsigned long long?(optional any value);";
    expect(target.textContent).toBe(text);
    expect(target.querySelector(".idlType").textContent).toBe(
      " unsigned long long?"
    );
    let prm = target.querySelectorAll(".idlParamName");
    expect(prm.length).toBe(1);
    expect(target.querySelectorAll(".idlType")[1].textContent).toBe(" any");
    expect(prm[0].textContent).toBe("value");

    // Links and IDs.
    expect(target.querySelector("a[href='#dom-cblessbasic']").textContent).toBe(
      "CbLessBasic"
    );
    expect(target.querySelector(".idlCallback").getAttribute("id")).toBe(
      "idl-def-cblessbasic"
    );

    target = doc.getElementById("cb-mult-args");
    text = "callback SortCallback = void (any a, any b);";
    expect(target.textContent).toBe(text);
    prm = target.querySelectorAll(".idlParamName");
    expect(prm.length).toBe(2);
    const idlTypes = target.getElementsByClassName("idlType");
    expect(idlTypes[1].textContent).toBe("any");
    expect(prm[0].textContent).toBe("a");
    expect(idlTypes[2].textContent).toBe(" any");
    expect(prm[1].textContent).toBe("b");
  });

  it("should handle typedefs", () => {
    let target = doc.getElementById("td-basic");
    let text = "typedef DOMString string;";
    expect(target.textContent).toBe(text);
    expect(target.querySelectorAll(".idlTypedef").length).toBe(1);
    expect(target.querySelector(".idlID").textContent).toBe("string");
    expect(target.querySelector(".idlType").textContent).toBe(" DOMString");

    target = doc.getElementById("td-less-basic");
    text = "typedef unsigned long long? tdLessBasic;";
    expect(target.textContent).toBe(text);

    // Links and IDs.
    expect(target.querySelector(".idlID").getAttribute("href")).toBe(
      "#dom-tdlessbasic"
    );
    expect(target.querySelector(".idlTypedef").id).toBe("idl-def-tdlessbasic");

    target = doc.getElementById("td-extended-attribute");
    text =
      "typedef ([Clamp] unsigned long or ConstrainULongRange) ConstrainULong;";
    expect(target.textContent).toBe(text);

    target = doc.getElementById("td-union-extended-attribute");
    text =
      "typedef [Clamp] (unsigned long or ConstrainULongRange) ConstrainULong2;";
    expect(target.textContent).toBe(text);

    target = doc.getElementById("td-trivia");
    text =
      "/* test1 */ typedef /* test2 */ [Clamp] /* test3 */ (/* test4 */ unsigned long /* test5 */ or /* test6 */ ConstrainULongRange /* test7 */ ) /* test8 */ ConstrainULong3 /* test9 */;";
    expect(target.textContent).toBe(text);
  });

  it("should handle includes", () => {
    let target = doc.getElementById("incl-basic");
    let text = "Window includes Breakable;";
    expect(target.textContent).toBe(text);
    expect(target.getElementsByClassName("idlIncludes").length).toBe(1);

    target = doc.getElementById("incl-less-basic");
    text = `[Something]${text}`;
    expect(target.textContent).toBe(text);
  });

  it("should link documentation", () => {
    const section = doc.getElementById("documentation");
    const target = doc.getElementById("doc-iface");

    expect(
      target.querySelector("a.idlName[href='#dom-documented-docstring']")
        .textContent
    ).toBe("docString");
    expect(
      section.querySelector("dfn#dom-documented-docstring").textContent
    ).toBe("docString");

    expect(section.querySelector("dfn#dfn-some-generic-term").textContent).toBe(
      "Some generic term"
    );
    expect(
      section.querySelector("a[href='#dfn-some-generic-term']").textContent
    ).toBe("Some generic term");
    expect(
      section.querySelector(
        "p[data-link-for] a[href='#dom-documented-docstring']"
      ).textContent
    ).toBe("docString");
    const notDefinedAttr = target.querySelectorAll(".idlAttribute dfn.idlName");
    expect(notDefinedAttr.length).toBe(1);
    expect(notDefinedAttr[0].getElementsByTagName("a").length).toBe(0);
    expect(notDefinedAttr[0].textContent).toBe("notDefined");
    expect(
      section.querySelector(
        "p[data-link-for] a[href='#dom-documented-notdefined']"
      ).textContent
    ).toBe("notDefined");

    const definedElsewhere = section.querySelector(
      "dfn#dom-documented-definedelsewhere"
    );
    const linkFromElsewhere = section.querySelector(
      "p:not([data-link-for]) a[href='#dom-documented-docstring']"
    );
    expect(definedElsewhere.textContent).toBe("Documented.definedElsewhere");
    expect(
      target.querySelector("a.idlName[href='#dom-documented-definedelsewhere']")
        .textContent
    ).toBe("definedElsewhere");
    expect(linkFromElsewhere.textContent).toBe("Documented.docString");

    expect(
      section.querySelector("#without-link-for a[href='#idl-def-documented']")
        .textContent
    ).toBe("Documented");
  });
  it("retains css classes afer processing", () => {
    const elem = doc.getElementById("retain-css-classes");
    const expected = ["a", "b", "c", "overlarge"];
    expect(expected.every(item => elem.classList.contains(item))).toBe(true);
  });
  it("links `[Default] object toJSON();` automatically to IDL spec", () => {
    const elem = doc.getElementById("AutoLinkToIDLSpec");
    const [defaultLink, objectLink, toJSONLink] = Array.from(
      elem.querySelectorAll("[data-title='toJSON'] a")
    ).map(elem => new URL(elem.href));
    expect(defaultLink.hash).toBe("#Default");
    expect(objectLink.hash).toBe("#idl-object");
    expect(toJSONLink.hash).toBe("#default-tojson-operation");
  });
  it("allows toJSON() to be defined in spec", () => {
    const elem = doc.getElementById("DefinedToJson");
    const [defaultLink, objectLink, toJSONLink] = Array.from(
      elem.querySelectorAll("[data-title='toJSON'] a")
    ).map(elem => new URL(elem.href));
    expect(defaultLink.hash).toBe("#Default");
    expect(objectLink.hash).toBe("#idl-object");
    expect(toJSONLink.pathname).toBe(doc.location.pathname);
    expect(toJSONLink.origin).toBe(doc.location.origin);
    expect(toJSONLink.hash).toBe("#dom-definedtojson-tojson");
  });
  it("puts code elements around both IDL definitions and links", () => {
    const things = [
      ...document.querySelectorAll("#coded-things > a, #coded-things > dfn"),
    ];
    expect(things.every(elem => elem.parentElement.localName === "code")).toBe(
      true
    );
    const linksToTheFoo = doc.querySelectorAll(
      "#coded-things a[href='#dom-codedthings-dothefoo']"
    );
    expect(linksToTheFoo.length).toBe(4);

    const linkToBarBarAttr = doc.querySelectorAll(
      "#coded-things a[href='#dom-codedthings-barbar']"
    );
    expect(linkToBarBarAttr.length).toBe(2);
  });
  it("sets the IDL type for each type of IDL token", async () => {
    const body = `
      <section id="idl-dfn-types">
        <pre class="idl">
          interface InterfaceType {
            readonly attribute DOMString attributeType;
            void operationType();
          };
          dictionary DictionaryType {
            DOMString fieldType;
          };
          enum EnumType {
            "enumValueType"
          };
        </pre>
        <p>
          <dfn>InterfaceType</dfn>
          <dfn data-dfn-for="InterfaceType">attributeType</dfn>
          <dfn data-dfn-for="InterfaceType">operationType</dfn>
          <dfn>DictionaryType</dfn>
          <dfn data-dfn-for="DictionaryType">fieldType</dfn>
          <dfn>EnumType</dfn>
          <dfn data-dfn-for="EnumType">enumValueType</dfn>
        </p>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    // interface InterfaceType
    const interfaceType = doc.getElementById("dom-interfacetype");
    expect(interfaceType.dataset.idl).toBe("interface");

    // attribute attributeType;
    const attributeType = doc.getElementById("dom-interfacetype-attributetype");
    expect(attributeType.dataset.idl).toBe("attribute");

    // operationType();
    const operationType = doc.getElementById("dom-interfacetype-operationtype");
    expect(operationType.dataset.idl).toBe("operation");

    // DictionaryType
    const dictionaryType = doc.getElementById("dom-dictionarytype");
    expect(dictionaryType.dataset.idl).toBe("dictionary");

    // fieldType member (field)
    const fieldType = doc.getElementById("dom-dictionarytype-fieldtype");
    expect(fieldType.dataset.idl).toBe("field");

    // enum EnumType
    const enumType = doc.getElementById("dom-enumtype");
    expect(enumType.dataset.idl).toBe("enum");

    // "enumValueType"
    const enumValueType = doc.getElementById("dom-enumtype-enumvaluetype");
    expect(enumValueType.dataset.idl).toBe("enum-value");
  });
  it("auto-links based on definition context", async () => {
    const body = `
      <section>
        <h2>Test</h2>
        <pre class="idl" id="link-test" data-cite="HTML DOM">
          interface Foo {
            DOMString fromWebIDL(); // defined in WebIDL
            attribute EventTarget fromDomSpec; // Defined in DOM
            attribute EventHandler fromHTMLSpec; // Defined in HTML
          };
        </pre>
      </section>
    `;
    const ops = makeStandardOps({ xref: true }, body);
    const doc = await makeRSDoc(ops);

    // DOMString fromWebIDL();
    const domString = doc.querySelector(
      "#link-test a[href='https://heycam.github.io/webidl/#idl-DOMString']"
    );
    expect(domString).toBeTruthy();

    // attribute EventTarget fromDomSpec; // Defined in DOM
    const eventTarget = doc.querySelector(
      "#link-test a[href='https://dom.spec.whatwg.org/#eventtarget']"
    );
    expect(eventTarget).toBeTruthy();

    // attribute EventHandler fromHTMLSpec; // Defined in HTML
    const eventHandler = doc.querySelector(
      "#link-test a[href='https://html.spec.whatwg.org/multipage/webappapis.html#eventhandler']"
    );
    expect(eventHandler).toBeTruthy();
  });

  it("auto-links some IDL types", async () => {
    const body = `
      <section>
        <pre class="idl" id="link-test">
          [Exposed=(Window, Worker, DedicatedWorker)]
          interface Foo {
            readonly attribute object bar;
          };
        </pre>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const windowAnchor = doc.querySelector("#link-test a[href$=window]");
    // Exposed=(Window)
    expect(windowAnchor.href).toBe(
      "https://html.spec.whatwg.org/multipage/window-object.html#window"
    );
    expect(windowAnchor.dataset.xrefType).toBe("interface");
    // Exposed=(Worker)
    const workerAnchor = doc.querySelector(
      "#link-test a[href$=workerglobalscope]"
    );
    expect(workerAnchor.href).toBe(
      "https://html.spec.whatwg.org/multipage/workers.html#workerglobalscope"
    );
    expect(workerAnchor.dataset.xrefType).toBe("interface");

    // Exposed=(DedicatedWoker)
    const dedicatedWorkerAnchor = doc.querySelector(
      "#link-test a[href$=dedicatedworkerglobalscope]"
    );
    expect(dedicatedWorkerAnchor.href).toBe(
      "https://html.spec.whatwg.org/multipage/workers.html#dedicatedworkerglobalscope"
    );
    expect(dedicatedWorkerAnchor.dataset.xrefType).toBe("interface");

    // readonly attribute object bar;
    const objectAnchor = doc.querySelector("#link-test a[href$=idl-object]");
    expect(objectAnchor.dataset.xrefType).toBe("interface");
    expect(objectAnchor.href).toBe(
      "https://heycam.github.io/webidl/#idl-object"
    );
  });

  it("exports IDL definitions", async () => {
    const body = `
      <section>
        <pre class="idl">
          interface Banana {
            void nana();
          };
        </pre>
        <p id="p" data-dfn-for="Banana">
          The interface <dfn>Banana</dfn> is nice
          and its operation <dfn>nana</dfn> is also nice.
          Our Banana is nice, so <dfn>Bananice</dfn>
        </p>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const p = doc.getElementById("p");
    const [banana, nana, bananice] = p.querySelectorAll("dfn");
    expect(banana.dataset.export).toBeDefined();
    expect(banana.dataset.dfnType).toBe("interface");
    expect(nana.dataset.export).toBeDefined();
    expect(nana.dataset.dfnType).toBe("method");
    expect(nana.dataset.dfnFor).toBe("Banana");
    expect(bananice.dataset.export).not.toBeDefined();
  });

  it("does not export partial IDL definitions", async () => {
    const body = `
      <section>
        <pre class="idl">
          partial interface Banana {
            void nana();
          };
        </pre>
        <p id="p">
          This partial interface <dfn>Banana</dfn> somehow requires
          a definition even if it's partial.
        </p>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const p = doc.getElementById("p");
    const banana = p.querySelector("dfn");
    expect(banana.dataset.export).not.toBeDefined();
  });
  it("autolinks partial definitions", async () => {
    const body = `
      <section data-dfn-for="EventInit">
        <p>
          <dfn>Banana</dfn>
          <dfn>itWorks</dfn>
        </p>
        <pre class="idl">
          // Local ref
          interface Banana {};
          // Local ref
          partial interface Banana {};
          // DOM spec
          partial interface mixin DocumentOrShadowRoot {};
          // Fetch spec
          partial interface Request {};
          // DOM spec
          partial dictionary EventInit {
            boolean itWorks;
          };
        </pre>
      </section>
    `;
    const ops = makeStandardOps({ xref: "web-platform" }, body);
    const doc = await makeRSDoc(ops);
    const [
      banana,
      bananaPartial,
      docOrShadowMixin,
      requestPartialInterface,
      eventInitDict, // skip testing boolean link (next line), tested elsewhere.
      ,
      itWorksMember,
    ] = doc.querySelectorAll(".idl a");

    expect(banana.textContent).toBe("Banana");
    expect(banana.getAttribute("href")).toBe("#dom-banana");
    expect(banana.dataset.linkType).toBe("interface");
    expect(banana.classList).toContain("internalDFN");

    expect(bananaPartial.textContent).toBe("Banana");
    expect(bananaPartial.getAttribute("href")).toBe("#dom-banana");
    expect(bananaPartial.dataset.linkType).toBe("interface");
    expect(banana.classList).toContain("internalDFN");

    expect(docOrShadowMixin.textContent).toBe("DocumentOrShadowRoot");
    expect(docOrShadowMixin.dataset.xrefType).toBe("interface");
    expect(docOrShadowMixin.dataset.linkType).toBe("interface");
    expect(docOrShadowMixin.dataset.idl).toBe("partial");
    expect(docOrShadowMixin.dataset.title).toBe("DocumentOrShadowRoot");
    expect(docOrShadowMixin.href).toBe(
      "https://dom.spec.whatwg.org/#documentorshadowroot"
    );

    expect(requestPartialInterface.textContent).toBe("Request");
    expect(requestPartialInterface.dataset.xrefType).toBe("interface");
    expect(requestPartialInterface.dataset.linkType).toBe("interface");
    expect(requestPartialInterface.dataset.idl).toBe("partial");
    expect(requestPartialInterface.dataset.title).toBe("Request");
    expect(requestPartialInterface.href).toBe(
      "https://fetch.spec.whatwg.org/#request"
    );

    expect(eventInitDict.textContent).toBe("EventInit");
    expect(eventInitDict.dataset.xrefType).toBe("dictionary");
    expect(eventInitDict.dataset.linkType).toBe("dictionary");
    expect(eventInitDict.dataset.idl).toBe("partial");
    expect(eventInitDict.dataset.title).toBe("EventInit");
    expect(eventInitDict.href).toBe(
      "https://dom.spec.whatwg.org/#dictdef-eventinit"
    );

    expect(itWorksMember.classList).toContain("internalDFN");
    expect(itWorksMember.getAttribute("href")).toBe("#dom-eventinit-itworks");
  });
  it("self-defining IDL", async () => {
    const body = `
      <section>
        <pre class="idl">
          interface RASAintShared {
            attribute DOMString layer;
          };
          enum TestEnum {""};
          partial interface TeaTime {};
        </pre>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const [it, attr, enumDfn, enumVal] = doc.querySelectorAll("pre dfn");

    expect(it.classList).not.toContain("respec-offending-element");
    expect(it.dataset.dfnType).toBe("interface");
    expect(it.dataset.export).toBe("");
    expect(it.id).toBe("dom-rasaintshared");

    expect(attr.dataset.dfnType).toBe("attribute");
    expect(attr.id).toBe("dom-rasaintshared-layer");

    expect(enumDfn.dataset.dfnType).toBe("enum");
    expect(enumDfn.id).toBe("dom-testenum");

    expect(enumVal.dataset.dfnType).toBe("enum-value");
    expect(enumVal.id).toBe("dom-testenum-the-empty-string");

    const [, tea] = doc.querySelectorAll(".respec-offending-element");
    expect(tea.textContent).toBe("TeaTime");
  });
  it("self-defining IDL with same member names", async () => {
    const body = `
      <section>
        <pre class="idl">
          dictionary Roselia {
            DOMString hikawa = "sayo";
          };
          dictionary PastelPalettes {
            DOMString hikawa = "hina";
          };
        </pre>
        <dfn>Roselia</dfn> and <dfn>PastelPalettes</dfn> are names of bands.
        <span id="links"><a>Roselia</a> <a>PastelPalettes</a> {{Roselia/hikawa}}</span>.
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const [member1, member2] = doc.querySelectorAll("pre dfn");
    expect(member1.dataset.dfnFor).toBe("Roselia");
    expect(member2.dataset.dfnFor).toBe("PastelPalettes");
    expect(member1.classList).not.toContain("respec-offending-element");
    expect(member2.classList).not.toContain("respec-offending-element");
    const [anchor1, anchor2, anchor3] = doc.querySelectorAll("#links a");
    expect(anchor1.getAttribute("href")).toBe("#dom-roselia");
    expect(anchor2.getAttribute("href")).toBe("#dom-pastelpalettes");
    expect(anchor3.getAttribute("href")).toBe("#dom-roselia-hikawa");
  });
  it("marks a failing IDL block", async () => {
    const body = `
      <section>
        <pre class="idl" id="pre">
          interface Muscle {}
        </pre>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const pre = doc.getElementById("pre");

    expect(pre.classList).toContain("respec-offending-element");
  });
  it("validates IDL", async () => {
    const body = `
      <section>
        <pre class="idl" id="circle">
          interface Circle {};
        </pre>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const idl = doc.getElementById("circle");

    expect(idl.classList).toContain("respec-offending-element");
    expect(idl.title).toContain("Exposed");
  });
  it("validates across IDL", async () => {
    const body = `
      <section>
        <pre class="idl">
          dictionary Bread {
            DOMString type = "melon";
          };
        </pre>
        <pre class="idl">
          [Exposed=Window]
          interface Moka {
            void eat(optional Bread bread);
          };
        </pre>
      </section>
    `;
    const ops = makeStandardOps(null, body);
    const doc = await makeRSDoc(ops);
    const [idl1, idl2] = doc.getElementsByTagName("pre");

    expect(idl1.classList).not.toContain("respec-offending-element");
    expect(idl2.classList).toContain("respec-offending-element");
    expect(idl2.title).toContain("Optional dictionary");
  });
});
