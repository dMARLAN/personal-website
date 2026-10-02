# Services

Services hold the logic and orchestrate repos and clients. They receive dependencies by constructor injection
(wired in `container.py`) and never touch SQL or HTTP request objects.

```
services/
├── content/       # ContentService: published content, admin get/save (publish), drafts, seeding; types.py
├── auth/          # AuthService (argon2, sessions, CSRF) and LoginThrottle; types.py
├── resume/        # ResumeService: the PDF on the data volume
└── revalidation/  # RevalidationService: calls the Next.js revalidation route
```

- Use `services/<name>/service.py`; types, result objects and error classes go in the adjacent `types.py`.
- Raise domain errors (`PreconditionFailedError`, `InvalidPasswordError`, ...); `routes/errors.py` maps them to
  status codes.
- A write that changes what a page shows calls `RevalidationService.revalidate(paths)` after it commits. A failed
  revalidation is reported (`RevalidationStatus.FAILED`), never raised: the write already happened.
