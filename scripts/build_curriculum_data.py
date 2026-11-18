"""Generate deterministic curriculum data from the Module Tracker worksheet."""

import argparse
import json
import re
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
MODULE_IDS = [f"M{i:02}" for i in range(1, 17)]
SECTION_IDS = (
    "mental-model", "architecture", "syntax", "lab",
    "debugging", "projects", "quiz", "references",
)
REQUIRED_COLUMNS = (
    "Mod #", "Phase", "Module Title", "Core Topics & Python Stack",
    "Recommended Model & Effort", "Est. Hours",
)


def read_tracker(path):
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        rows = iter(workbook["Module Tracker"].values)
        header = next((row for row in rows if row[0] == "Mod #"), None)
        if header is None or any(label not in header for label in REQUIRED_COLUMNS):
            raise ValueError("Module Tracker is missing one or more required column headers.")
        columns = [header.index(label) for label in REQUIRED_COLUMNS]

        phases, modules = {}, {}
        for row in rows:
            module_id = row[columns[0]]
            if module_id in (None, "TOTAL"):
                continue
            if module_id not in MODULE_IDS or module_id in modules:
                raise ValueError(f"Unexpected or duplicate module ID: {module_id!r}")
            _, phase, title, topics, model, hours = [row[index] for index in columns]
            if not all(isinstance(value, str) and value.strip()
                       for value in (phase, title, topics, model)):
                raise ValueError(f"{module_id} has missing curriculum metadata.")
            match = re.fullmatch(r"(Phase [1-3]):\s+(.+)", phase)
            if not match:
                raise ValueError(f"{module_id} has an invalid phase name: {phase!r}")
            label, name = match.groups()
            phase_id = label.lower().replace(" ", "-")
            phase_entry = dict(id=phase_id, label=label, title=name)
            if phases.setdefault(phase_id, phase_entry) != phase_entry:
                raise ValueError(f"Inconsistent names for {label}.")
            if type(hours) not in (int, float) or not 0 < hours < float("inf"):
                raise ValueError(f"{module_id} needs a positive numerical estimate.")
            modules[module_id] = dict(
                id=module_id, phaseId=phase_id, title=title.strip(),
                topics=topics.strip(), model=model.strip(), targetHours=hours,
            )
        if set(modules) != set(MODULE_IDS) or len(phases) != 3:
            raise ValueError("Expected M01 through M16 across three phases.")
        return dict(
            phases=[phases[key] for key in sorted(phases)],
            modules=[modules[key] for key in MODULE_IDS],
            targetHours=sum(module["targetHours"] for module in modules.values()),
        )
    finally:
        workbook.close()


def read_lesson_sections(module_id):
    path = ROOT / "scripts" / "lessons" / f"{module_id.lower()}.md"
    lines = path.read_text(encoding="utf-8").splitlines()
    headings = []
    fence = None
    for index, line in enumerate(lines):
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if fence:
            if marker and marker[1].startswith(fence) and not marker[2].strip():
                fence = None
            continue
        if marker:
            fence = marker[1]
            continue
        heading = re.fullmatch(r"## ([1-8])\. .+", line)
        if heading:
            headings.append((int(heading[1]), index))
    if [number for number, _ in headings] != list(range(1, 9)):
        raise ValueError(f"{path.name} needs the eight numbered template sections in order.")
    sections = {}
    boundaries = [line for _, line in headings] + [len(lines)]
    for key, start, end in zip(SECTION_IDS, boundaries[:-1], boundaries[1:], strict=True):
        sections[key] = "\n".join(lines[start + 1:end]).strip()
        if not sections[key]:
            raise ValueError(f"{path.name} is missing content for {key}.")
    return sections


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workbook", type=Path, default=ROOT / "AI_Systems_Curriculum_Tracker.xlsx")
    parser.add_argument("--output", type=Path, default=ROOT / "src" / "data")
    options = parser.parse_args()
    curriculum = read_tracker(options.workbook)
    lessons = {module["id"]: read_lesson_sections(module["id"]) for module in curriculum["modules"]}
    practice = {}
    for module in curriculum["modules"]:
        module_id = module["id"]
        sections = lessons[module_id]
        # Keep the dashboard's synchronous progress lookup independent of the full reading bundle.
        practice[module_id] = {key: sections[key] for key in ("projects", "quiz")}
        write_json(options.output / "modules" / f"{module_id.lower()}.json", {
            "metadata": module, "sections": sections,
        })
    write_json(options.output / "practice.json", practice)
    write_json(options.output / "curriculum.json", curriculum)
    print(f"Generated {len(curriculum['modules'])} modules ({curriculum['targetHours']:.1f} target hours).")


if __name__ == "__main__":
    main()
