import { EXPLORATION_PASSES_CHECKLIST } from "./passesChecklist.js";

// Validated end-to-end against the CRUD test-fixtures/sample-java-swing-app:
// the risk-flagging pass correctly caught the planted SQL injection and
// swallowed exception, with no hallucinated content.
export const javaSwingAdapter = {
  id: "java_swing",
  displayName: "Java Swing / NetBeans",

  detect(inventory) {
    const ext = inventory.byExtension;
    const hasBuildFile = inventory.files.some(
      (file) => file.path.endsWith("build.xml") || file.path.endsWith("pom.xml"),
    );
    return Boolean(ext[".form"]) || (Boolean(ext[".java"]) && (Boolean(ext[".gradle"]) || hasBuildFile));
  },

  promptContext: `
You are analyzing a Java Swing desktop application, likely built with the
NetBeans GUI builder.

Detection signatures: .form files (NetBeans GUI builder metadata),
"javax.swing.*" imports, a build.xml (Ant) or Maven/Gradle build file.

Known quirks to watch for:
- Business logic is frequently embedded directly inside UI event listener
  classes rather than separated into a distinct layer — trace listener
  method bodies carefully rather than assuming logic lives elsewhere.
- .form files are GUI-builder metadata paired with a same-named .java file
  (similar to WinForms designer files) — treat the .form file as layout
  boilerplate and the .java file as where the real behavior lives.
- Data access commonly uses raw JDBC rather than an ORM — trace Connection/
  Statement/PreparedStatement usage to reconstruct the database schema, and
  flag any query built via string concatenation as a SQL injection risk.

${EXPLORATION_PASSES_CHECKLIST}
`.trim(),
};
