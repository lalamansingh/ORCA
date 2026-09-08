"""Redacted current/history credential-pattern audit; emits paths, never values."""
import re
import subprocess
import sys

patterns = [
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"(?:sk-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16})"),
    re.compile(rb"(?:postgres(?:ql)?(?:\+asyncpg)?://)[^\s:/]+:([^\s@]+)@"),
    re.compile(rb"(?:JWT_SECRET_KEY|OPENAI_API_KEY|POSTGRES_PASSWORD)[ \t]*=[ \t]*([^\s#]+)"),
]
allowed = (b"local_dev", b"replace-with", b"test-only", b"secure-db-credential", b"${", b"<", b"example", b"os.environ", b"settings.", b"process.env")
findings = set()
revisions = subprocess.check_output(["git", "rev-list", "--all"], text=True).splitlines()
for revision in [None, *revisions]:
    paths = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"] if revision is None else ["git", "ls-tree", "-r", "--name-only", "-z", revision]).decode().split("\0")
    for path in filter(None, paths):
        try:
            data = open(path, "rb").read() if revision is None else subprocess.check_output(["git", "show", f"{revision}:{path}"], stderr=subprocess.DEVNULL)
        except (OSError, subprocess.CalledProcessError):
            continue
        for pattern in patterns:
            for match in pattern.finditer(data):
                value = match.group(0)
                if any(marker in value for marker in allowed): continue
                findings.add(("current" if revision is None else revision[:8], path))
for revision, path in sorted(findings):
    print(f"REVIEW {revision} {path} (value redacted)")
print(f"Scanned current tracked files and {len(revisions)} revisions; {len(findings)} file/revision candidates.")
sys.exit(bool(findings))
