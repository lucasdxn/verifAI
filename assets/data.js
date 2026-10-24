/* verifAI demo data. Everything here is sample content. */
window.RW_DATA = {
  user: { id: 'alex', name: 'Alex Lindner', initials: 'AL' },
  manager: { name: 'Maria Keller', initials: 'MK' },

  lanes: [
    { id: 'py', name: 'Python', tag: 'Py', sub: 'Backend services and scripts', c: '#5856D6', hi: '#ABAAF4', ring: '#D0CFF8', rows: 3 },
    { id: 'ts', name: 'TypeScript', tag: 'TS', sub: 'Web app and internal tools', c: '#007C92', hi: '#7FD3E3', ring: '#C2E9F0', rows: 3 },
    { id: 'go', name: 'Go', tag: 'Go', sub: 'Platform and infrastructure', c: '#248A3D', hi: '#8EDBA3', ring: '#C7EDD1', rows: 2 }
  ],

  stages: ['BASICS', 'CORE', 'DATA WORK', 'INTEGRATION', 'ADVANCED'],

  // id, lane, column, row, name, status, progress %, optional?, description, requires (ids), verified date
  nodes: [
    ['py-vars', 'py', 0, 0, 'Variables & data types', 'verified', 100, false, 'Names, numbers, strings, booleans and how Python treats them.', [], '8.9.'],
    ['py-flow', 'py', 0, 1, 'Control flow & logic', 'verified', 100, false, 'if / elif / else, loops, break and continue.', ['py-vars'], '12.9.'],
    ['py-coll', 'py', 1, 0, 'Lists, dicts & sets', 'verified', 100, false, 'Built-in collections, indexing, slicing and common methods.', ['py-flow'], '24.9.'],
    ['py-fn', 'py', 1, 1, 'Functions', 'verified', 100, false, 'Defining functions, arguments, return values and scope.', ['py-flow'], '22.10.'],
    ['py-str', 'py', 2, 0, 'Strings & formatting', 'ready', 0, false, 'f-strings, string methods and working with text.', ['py-coll'], ''],
    ['py-mod', 'py', 2, 1, 'Modules, files & JSON', 'learning', 30, false, 'Imports, reading and writing files, parsing JSON.', ['py-fn'], ''],
    ['py-err', 'py', 2, 2, 'Error handling', 'learning', 70, false, 'try / except / finally, raising and custom exceptions.', ['py-fn'], ''],
    ['py-comp', 'py', 3, 0, 'Comprehensions', 'ready', 0, true, 'Building lists, dicts and sets in one expression.', ['py-coll'], ''],
    ['py-oop', 'py', 3, 1, 'Classes & objects', 'locked', 0, false, 'Classes, instances, inheritance and dunder methods.', ['py-fn', 'py-coll'], ''],
    ['py-hints', 'py', 3, 2, 'Type hints', 'locked', 0, false, 'Annotating functions and data so tools can check your code.', ['py-fn', 'py-mod'], ''],
    ['py-gen', 'py', 4, 0, 'Generators', 'locked', 0, true, 'yield, lazy sequences and iterators.', ['py-comp'], ''],
    ['py-async', 'py', 4, 1, 'Async & await', 'learning', 15, false, 'Coroutines, the event loop and limiting concurrency.', ['py-fn', 'py-err'], ''],
    ['py-test', 'py', 4, 2, 'Testing with pytest', 'locked', 0, false, 'Writing tests, fixtures and running them in CI.', ['py-oop', 'py-mod'], ''],
    ['ts-types', 'ts', 0, 1, 'Types & annotations', 'verified', 100, false, 'Primitive types, inference and annotating variables.', [], '1.10.'],
    ['ts-fn', 'ts', 1, 0, 'Functions', 'verified', 100, false, 'Typed parameters, return types and arrow functions.', ['ts-types'], '9.10.'],
    ['ts-obj', 'ts', 1, 2, 'Objects & interfaces', 'learning', 45, false, 'Describing object shapes with interface and type.', ['ts-types'], ''],
    ['ts-union', 'ts', 2, 0, 'Unions & narrowing', 'ready', 0, false, 'Union types and narrowing them with checks.', ['ts-fn'], ''],
    ['ts-arr', 'ts', 2, 1, 'Arrays & tuples', 'ready', 0, false, 'Typed arrays, tuples and readonly data.', ['ts-types'], ''],
    ['ts-gen', 'ts', 3, 1, 'Generics', 'locked', 0, false, 'Reusable types and functions with type parameters.', ['ts-obj'], ''],
    ['ts-prom', 'ts', 3, 2, 'Promises', 'locked', 0, false, 'Creating, chaining and handling rejected promises.', ['ts-fn', 'ts-obj'], ''],
    ['ts-util', 'ts', 4, 1, 'Utility types', 'locked', 0, true, 'Partial, Pick, Record and friends.', ['ts-gen'], ''],
    ['ts-async', 'ts', 4, 2, 'async / await', 'locked', 0, false, 'Writing async code that reads top to bottom.', ['ts-prom'], ''],
    ['go-vars', 'go', 0, 0, 'Variables & types', 'ready', 0, false, 'var, :=, basic types and zero values.', [], ''],
    ['go-flow', 'go', 1, 0, 'Control flow', 'locked', 0, false, 'if, for and switch the Go way.', ['go-vars'], ''],
    ['go-slice', 'go', 1, 1, 'Slices & maps', 'locked', 0, false, 'Dynamic arrays and hash maps.', ['go-vars'], ''],
    ['go-fn', 'go', 2, 0, 'Functions & errors', 'locked', 0, false, 'Multiple returns and errors as values.', ['go-flow'], ''],
    ['go-struct', 'go', 2, 1, 'Structs & methods', 'locked', 0, false, 'Grouping data and attaching behaviour.', ['go-slice'], ''],
    ['go-iface', 'go', 3, 1, 'Interfaces', 'locked', 0, false, 'Implicit interfaces and composition.', ['go-struct'], ''],
    ['go-gor', 'go', 4, 0, 'Goroutines', 'locked', 0, false, 'Lightweight concurrent functions.', ['go-fn'], ''],
    ['go-chan', 'go', 4, 1, 'Channels', 'locked', 0, false, 'Passing data safely between goroutines.', ['go-gor'], '']
  ],

  // Same idea in another language: a shorter challenge
  related: [['ts-types', 'py-hints'], ['py-flow', 'go-flow'], ['py-async', 'ts-async']],

  // Career ladder: one entry per developer level, with the matching position and indicative salaries.
  // EUR: Germany, gross per year (jobrise.io, Software Salary and Job Market in Germany 2026).
  // USD: United States, base salary per year (Scaler, Software Engineer Salary in the US 2026, citing BLS, PayScale, Glassdoor).
  // Interns: PayScale, early-career software engineering intern, hourly (Dec 2025).
  career: [
    { name: 'Newcomer', position: 'Intern / trainee', eur: 'Varies (internship or apprenticeship pay)', usd: '$16–42 per hour' },
    { name: 'Beginner', position: 'Entry-level developer', eur: '€42,000–55,000', usd: '$80,000–92,000' },
    { name: 'Junior', position: 'Junior developer', eur: '€42,000–55,000', usd: '$90,000–115,000' },
    { name: 'Intermediate', position: 'Software developer (mid-level)', eur: '€55,000–72,000', usd: '$115,000–155,000' },
    { name: 'Advanced', position: 'Experienced developer', eur: '€62,000–72,000', usd: '$130,000–155,000', note: 'Upper part of the mid-level range' },
    { name: 'Senior', position: 'Senior developer', eur: '€72,000–95,000', usd: '$150,000–213,000' },
    { name: 'Full Stack Engineer', position: 'Senior full stack engineer', eur: '€90,000–120,000', usd: '$180,000–250,000', note: 'Lead-level range: the sources don\'t list full stack separately' }
  ],
  // Full Stack Engineer: Senior in TypeScript plus Senior in a backend language.
  fullStackSets: [['ts', 'py'], ['ts', 'go']],
  salarySources: [
    ['jobrise.io · Germany 2026', 'https://jobrise.io/en/blog/software-salary-and-job-market-in-germany-2026/'],
    ['Scaler · US 2026', 'https://www.scaler.com/topics/software-engineer-salary-in-us/'],
    ['PayScale · US interns', 'https://www.payscale.com/research/US/Job=Software_Engineering_Intern/Hourly_Rate/ce88ba13/Early-Career']
  ],

  // Words that tie a question to a concept (used by the assistant chat's gate)
  keywords: {
    'py-vars': ['variable', 'variables', 'data type', 'data types', 'integer', 'float', 'boolean'],
    'py-flow': ['if statement', 'if/else', 'elif', 'loop', 'loops', 'for loop', 'while loop', 'control flow'],
    'py-coll': ['list', 'lists', 'dict', 'dicts', 'dictionary', 'tuple', 'slicing'],
    'py-fn': ['function', 'functions', 'def', 'return value', 'argument', 'arguments', 'parameter', 'parameters', 'scope'],
    'py-str': ['string', 'strings', 'f-string', 'string formatting', 'strip()', 'split()', 'join()'],
    'py-mod': ['module', 'modules', 'import', 'package', 'file', 'files', 'json'],
    'py-err': ['exception', 'exceptions', 'error handling', 'try/except', 'try except', 'except', 'raise', 'traceback'],
    'py-comp': ['comprehension', 'comprehensions'],
    'py-oop': ['class', 'classes', 'object', 'objects', 'inheritance', 'method', 'methods', '__init__', 'dunder'],
    'py-hints': ['type hint', 'type hints', 'mypy', 'typing'],
    'py-gen': ['generator', 'generators', 'yield', 'iterator', 'iterators'],
    'py-async': ['async', 'await', 'asyncio', 'coroutine', 'coroutines', 'event loop', 'concurrent', 'concurrency', 'semaphore'],
    'py-test': ['pytest', 'fixture', 'fixtures', 'unit test', 'unit tests'],
    'ts-types': ['type annotation', 'type annotations', 'type inference'],
    'ts-fn': ['function', 'functions', 'arrow function', 'return type', 'parameter', 'parameters'],
    'ts-obj': ['interface', 'interfaces', 'object type', 'object shape'],
    'ts-union': ['union', 'unions', 'narrowing', 'type guard'],
    'ts-arr': ['array', 'arrays', 'tuple', 'tuples', 'readonly'],
    'ts-gen': ['generic', 'generics', 'type parameter'],
    'ts-prom': ['promise', 'promises'],
    'ts-util': ['utility type', 'utility types', 'partial<', 'record<', 'omit<'],
    'ts-async': ['async', 'await'],
    'go-vars': ['variable', 'variables', 'zero value'],
    'go-flow': ['loop', 'for loop', 'switch', 'if statement'],
    'go-slice': ['slice', 'slices', 'map', 'maps'],
    'go-fn': ['function', 'functions', 'multiple return', 'error value'],
    'go-struct': ['struct', 'structs', 'method', 'methods'],
    'go-iface': ['interface', 'interfaces'],
    'go-gor': ['goroutine', 'goroutines', 'concurrency', 'concurrent'],
    'go-chan': ['channel', 'channels']
  },

  // Short checks at a guided task's finish line (solved without the assistant)
  checks: {
    'py-err': { q: 'Write <code>to_int(s)</code> that returns <code>int(s)</code>, or <code>0</code> if <code>s</code> isn\'t a number.', must: ['try\\s*:[\\s\\S]*int\\s*\\(', 'except\\s+ValueError'] },
    'py-async': { q: 'Write <code>async def both(a, b)</code> that awaits two coroutines at the same time and returns both results.', must: ['async\\s+def\\s+both', 'gather', 'await'] },
    'py-str': { q: 'Write <code>greet(name)</code> that returns <code>"Hello, NAME!"</code> with the name in capitals, using an f-string.', must: ['f["\']', '\\.upper\\(\\)'] },
    'py-comp': { q: 'In one expression, build the squares of the even numbers from 0 to 9.', must: ['\\[[^\\]]*for\\s+\\w+\\s+in[^\\]]*if[^\\]]*\\]'] },
    'py-mod': { q: 'Write <code>port(path)</code> that reads a JSON file and returns its <code>"port"</code> value.', must: ['with\\s+open\\(', 'json\\.load\\('] },
    'ts-obj': { q: 'Write an interface <code>Point</code> with numeric <code>x</code> and <code>y</code>.', must: ['interface\\s+Point', 'x\\s*:\\s*number', 'y\\s*:\\s*number'] },
    'ts-union': { q: 'Write a type <code>Shape</code> that can only be <code>"circle"</code> or <code>"square"</code>.', must: ['type\\s+Shape\\s*=', '["\'][a-z]+["\']\\s*\\|\\s*["\'][a-z]+["\']'] },
    'go-vars': { q: 'Declare <code>name</code> as "verifai" and <code>count</code> as 3 using short declarations.', must: ['name\\s*:=', 'count\\s*:='] },
    'go-flow': { q: 'Loop from 1 to 5 and print only the even numbers.', must: ['for\\s', 'if\\s'] }
  },

  // Ready-made guided tasks. Steps: plan (agree details), assist (AI writes it: only verified concepts),
  // learn (you write it, the tutor reviews), finish (short checks on your own).
  library: [
    {
      id: 'plat-412', ticket: 'PLAT-412', lane: 'py', title: 'Sync supplier prices concurrently',
      brief: 'Pull current prices from all 40 supplier APIs, at most 5 at a time, and skip suppliers that fail without stopping the job.',
      teaches: ['py-err', 'py-async'], uses: ['py-coll', 'py-flow', 'py-fn'],
      steps: [
        { kind: 'plan', title: 'Plan the job together', intro: 'Before any code: the job goes through every supplier, fetches its price and stores it.',
          ask: { q: 'How often should the job run?', opts: ['Every hour', 'Once a night'], reply: { 'Every hour': 'Then speed matters, which is why we\'ll fetch suppliers at the same time later on.', 'Once a night': 'Fine. We\'ll still make it fast so a slow supplier can\'t hold up the rest.' } } },
        { kind: 'assist', title: 'Fetch one supplier', uses: ['py-fn', 'py-coll'],
          intro: 'Fetching one supplier only uses Functions and Lists & dicts, which you\'ve verified, so I wrote this part. Read it and make sure each line makes sense.',
          code: 'import httpx\nfrom suppliers import SUPPLIERS\n\ndef fetch_price(supplier):\n    r = httpx.get(supplier["url"], timeout=5)\n    return r.json()["price"]\n' },
        { kind: 'learn', title: 'Handle failed suppliers', teach: 'py-err',
          intro: 'Some suppliers will time out. Python lets you <b>try</b> something and <b>catch</b> what goes wrong:',
          example: 'try:\n    risky()\nexcept ValueError:\n    handle_it()',
          ask: { q: 'When a supplier fails, should the job retry it or skip it and log it?', opts: ['Skip and log', 'Retry once'], reply: { 'Skip and log': 'Good, that keeps the job simple. Wrap the call in fetch_price() and catch the failure.', 'Retry once': 'Fair, but let\'s keep retries for later: skip and log for now, and note the retry idea in a comment.' } },
          code: 'import httpx\nfrom suppliers import SUPPLIERS\n\ndef fetch_price(supplier):\n    try:\n        r = httpx.get(supplier["url"], timeout=5)\n        return r.json()["price"]\n    except:\n        log.warning("skipped %s", supplier["name"])\n        return None\n',
          must: ['except\\s+\\(?\\s*[A-Za-z_.]+'], mustNot: ['except\\s*:'],
          bad: '<b>Line 8:</b> a bare <code>except:</code> also swallows typos and Ctrl+C. Which errors can a supplier call actually raise? Name them (for example <code>httpx.HTTPError</code>), then catch only those.',
          good: 'Nice, you catch only what can actually go wrong. Ready for the next step.' },
        { kind: 'learn', title: 'Run requests concurrently', teach: 'py-async',
          intro: 'Right now suppliers are fetched one by one. With <b>async</b> functions Python can wait for many at once:',
          example: 'async def get(x):\n    return await slow(x)\n\nresults = await asyncio.gather(get(1), get(2))',
          ask: { q: 'Does the order of the results matter for the job?', opts: ['Yes, match suppliers', 'No'], reply: { 'Yes, match suppliers': 'Then gather() is perfect: it returns results in the order you passed them in.', 'No': 'Good to know. gather() keeps the order anyway, which makes logging easier.' } },
          code: 'import asyncio\nimport httpx\nfrom suppliers import SUPPLIERS\n\ndef fetch_price(client, supplier):\n    try:\n        r = client.get(supplier["url"], timeout=5)\n        return r.json()["price"]\n    except httpx.HTTPError:\n        return None\n\n# make fetch_price async and run all suppliers with asyncio.gather\n',
          must: ['async\\s+def\\s+fetch_price', 'await', 'asyncio\\.gather'],
          bad: 'Almost: <code>fetch_price</code> needs to be an <code>async def</code>, the request needs an <code>await</code>, and all suppliers should run through <code>asyncio.gather</code>.',
          good: 'All 40 suppliers now run at once. Next we make sure we don\'t hit them all at the same moment.' },
        { kind: 'learn', title: 'Limit to 5 at a time', teach: 'py-async',
          intro: 'A <b>semaphore</b> is a counter that lets only N tasks through at once:',
          example: 'sem = asyncio.Semaphore(3)\n\nasync with sem:\n    await work()',
          ask: { q: 'Should the limit be fixed at 5 or configurable?', opts: ['Fixed at 5', 'Configurable'], reply: { 'Fixed at 5': 'OK, keep it as a constant at the top of the file so it\'s easy to find.', 'Configurable': 'Good call. Pass it in as a parameter with 5 as the default.' } },
          code: 'import asyncio\nimport httpx\nfrom suppliers import SUPPLIERS\n\nasync def fetch_price(client, supplier):\n    try:\n        r = await client.get(supplier["url"], timeout=5)\n        return r.json()["price"]\n    except httpx.HTTPError:\n        return None\n\nasync def sync_all():\n    async with httpx.AsyncClient() as client:\n        return await asyncio.gather(*(fetch_price(client, s) for s in SUPPLIERS))\n',
          must: ['Semaphore\\s*\\(', 'async\\s+with\\s+\\w*sem'],
          bad: 'Create an <code>asyncio.Semaphore(5)</code> and wrap the request in <code>async with</code> it, so only 5 run at once.',
          good: 'That\'s the whole job. Last step: short checks on your own.' },
        { kind: 'finish', title: 'Finish line: short checks' }
      ]
    },
    {
      id: 'csv-emails', ticket: 'PLAT-430', lane: 'py', title: 'Clean up a customer email list',
      brief: 'Take a list of raw email addresses, trim spaces, make them lower case and keep only the ones that contain an @.',
      teaches: ['py-str', 'py-comp'], uses: ['py-coll', 'py-flow', 'py-fn'],
      steps: [
        { kind: 'plan', title: 'Agree what "clean" means', intro: 'Before coding, let\'s agree on the rules for a clean address.',
          ask: { q: 'Should duplicates be removed too?', opts: ['Yes, remove them', 'No, keep them'], reply: { 'Yes, remove them': 'OK. Once the addresses are normalised, duplicates are easy to drop. We\'ll note that for the end.', 'No, keep them': 'Fine, then every row stays and we only fix the format.' } } },
        { kind: 'assist', title: 'Load the list', uses: ['py-fn', 'py-coll'],
          intro: 'Loading the addresses into a list only uses Functions and Lists & dicts, which you\'ve verified, so I wrote it:',
          code: 'RAW = ["  Ana@Example.com", "bob@example.com ", "not-an-email", "ANA@example.com"]\n\ndef load_emails():\n    return list(RAW)\n' },
        { kind: 'learn', title: 'Normalise one address', teach: 'py-str',
          intro: 'Strings have methods that return a cleaned-up copy:',
          example: '"  Hi  ".strip()   # "Hi"\n"ABC".lower()      # "abc"',
          ask: { q: 'Should we also remove spaces inside the address?', opts: ['Only at the ends', 'Everywhere'], reply: { 'Only at the ends': 'Right, spaces inside would make it invalid anyway. strip() handles the ends.', 'Everywhere': 'Careful: a space inside usually means a typo, and removing it could merge two words. Let\'s only trim the ends for now.' } },
          code: 'def normalise(email):\n    # trim spaces at both ends and make it lower case\n    return email\n',
          must: ['\\.strip\\(\\)', '\\.lower\\(\\)'],
          bad: 'Use <code>.strip()</code> to remove the spaces and <code>.lower()</code> to make it lower case, then return the result.',
          good: 'That turns "  Ana@Example.com" into "ana@example.com". Next: the whole list in one line.' },
        { kind: 'learn', title: 'Keep only valid addresses', teach: 'py-comp',
          intro: 'A <b>comprehension</b> builds a new list from an old one and can filter at the same time:',
          example: '[n * 2 for n in nums if n > 0]',
          ask: { q: 'Should invalid addresses be logged?', opts: ['Yes', 'No'], reply: { 'Yes': 'Then keep a second, small loop for logging. The comprehension stays focused on building the clean list.', 'No': 'Simple: the comprehension just leaves them out.' } },
          code: 'def clean(emails):\n    result = []\n    for e in emails:\n        if "@" in e:\n            result.append(normalise(e))\n    return result\n\n# rewrite clean() as one list comprehension\n',
          must: ['\\[[^\\]]*for\\s+\\w+\\s+in[^\\]]*if[^\\]]*\\]'],
          bad: 'Write it as one expression, shaped like <code>[normalise(e) for e in emails if ...]</code>.',
          good: 'One line instead of five, and it reads like the requirement.' },
        { kind: 'finish', title: 'Finish line: short checks' }
      ]
    },
    {
      id: 'json-config', ticket: 'PLAT-441', lane: 'py', title: 'Read app settings from a JSON file',
      brief: 'Load settings.json when the app starts and fall back to defaults for any missing setting.',
      teaches: ['py-mod'], uses: ['py-coll', 'py-fn'],
      steps: [
        { kind: 'plan', title: 'Decide the fallbacks', intro: 'The app needs a port and a debug flag. Some installs won\'t have every setting.',
          ask: { q: 'What should happen if settings.json doesn\'t exist at all?', opts: ['Use the defaults', 'Stop with an error'], reply: { 'Use the defaults': 'Friendly for local development. We\'ll start from the defaults.', 'Stop with an error': 'Safer for production. We\'ll let the error show if the file is missing.' } } },
        { kind: 'learn', title: 'Open and parse the file', teach: 'py-mod',
          intro: 'Use <b>with open(...)</b> so the file closes itself, and the <b>json</b> module to parse it:',
          example: 'import json\n\nwith open("data.json") as f:\n    data = json.load(f)',
          code: 'DEFAULTS = {"port": 8080, "debug": False}\n\ndef read_file(path):\n    # open the file and return the parsed JSON\n    return {}\n',
          must: ['import\\s+json', 'with\\s+open\\(', 'json\\.load\\('],
          bad: 'Import <code>json</code>, open the file with <code>with open(path) as f:</code> and parse it with <code>json.load(f)</code>.',
          good: 'The file is read and closed properly. Merging comes next.' },
        { kind: 'assist', title: 'Merge with the defaults', uses: ['py-coll', 'py-fn'],
          intro: 'Merging two dicts only uses Lists & dicts and Functions, which you\'ve verified, so here it is:',
          code: 'def load_settings(path):\n    data = read_file(path)\n    return {**DEFAULTS, **data}\n' },
        { kind: 'finish', title: 'Finish line: short checks' }
      ]
    },
    {
      id: 'ts-profile', ticket: 'WEB-208', lane: 'ts', title: 'Type the user profile API response',
      brief: 'The profile endpoint returns a name, an email and a status. Give it proper types so the editor catches mistakes.',
      teaches: ['ts-obj', 'ts-union'], uses: ['ts-types', 'ts-fn'],
      steps: [
        { kind: 'plan', title: 'Check the API response', intro: 'The endpoint returns JSON like <code>{"name": "Ana", "email": "ana@x.com", "status": "active"}</code>.',
          ask: { q: 'Can email be missing for some users?', opts: ['Yes, it\'s optional', 'No, always there'], reply: { 'Yes, it\'s optional': 'Then we\'ll mark it with a question mark, <code>email?: string</code>.', 'No, always there': 'Good, a plain <code>email: string</code> it is.' } } },
        { kind: 'learn', title: 'Describe the response shape', teach: 'ts-obj',
          intro: 'An <b>interface</b> names the shape of an object:',
          example: 'interface Point {\n  x: number;\n  y: number;\n}',
          code: '// describe the profile response here\n\nconst profile = await fetchProfile();\n',
          must: ['interface\\s+\\w+\\s*\\{', 'name\\??\\s*:\\s*string'],
          bad: 'Write <code>interface Profile { name: string; ... }</code> with a field for each value the API returns.',
          good: 'The editor now knows what a profile looks like.' },
        { kind: 'learn', title: 'Limit the status values', teach: 'ts-union',
          intro: 'A <b>union</b> type only allows certain values:',
          example: 'type Size = "small" | "large";',
          code: 'interface Profile {\n  name: string;\n  email: string;\n  status: string; // only "active", "invited" or "blocked"\n}\n',
          must: ['["\'][a-z]+["\']\\s*\\|\\s*["\'][a-z]+["\']'],
          bad: 'Give <code>status</code> a union like <code>"active" | "invited" | "blocked"</code> instead of <code>string</code>.',
          good: 'A typo like "actve" is now a compile error.' },
        { kind: 'assist', title: 'Use it in a function', uses: ['ts-fn', 'ts-types'],
          intro: 'A typed function only uses Functions and Types, which you\'ve verified, so I wrote it:',
          code: 'function displayName(p: Profile): string {\n  return p.status === "blocked" ? "(blocked)" : p.name;\n}\n' },
        { kind: 'finish', title: 'Finish line: short checks' }
      ]
    },
    {
      id: 'go-status', ticket: 'OPS-77', lane: 'go', title: 'Print a service status report',
      brief: 'Write a small Go program that goes through three services and prints which ones are down.',
      teaches: ['go-vars', 'go-flow'], uses: [],
      steps: [
        { kind: 'plan', title: 'Decide what to report', intro: 'We have three services: api, web and db. Each is up or down.',
          ask: { q: 'Should the report show healthy services too?', opts: ['Only the ones down', 'All of them'], reply: { 'Only the ones down': 'Short and useful. We\'ll print a line only when something is down.', 'All of them': 'OK, we\'ll print every service with its state.' } } },
        { kind: 'learn', title: 'Store the service data', teach: 'go-vars',
          intro: 'In Go, <b>:=</b> declares a variable and works out its type:',
          example: 'count := 3\nname := "api"',
          code: 'package main\n\nimport "fmt"\n\nfunc main() {\n\t// declare services and which ones are down\n\tfmt.Println("report")\n}\n',
          must: [':='],
          bad: 'Declare your data with <code>:=</code>, for example <code>services := []string{"api", "web", "db"}</code>.',
          good: 'Go worked out the types for you.' },
        { kind: 'learn', title: 'Loop and check', teach: 'go-flow',
          intro: 'Go has one loop keyword, <b>for</b>, and <b>if</b> works like you\'d expect:',
          example: 'for i, s := range items {\n\tif s == "x" {\n\t\tfmt.Println(i)\n\t}\n}',
          code: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tservices := []string{"api", "web", "db"}\n\tdown := map[string]bool{"db": true}\n\t// loop over services and print the ones that are down\n\tfmt.Println(services, down)\n}\n',
          must: ['for\\s', 'if\\s'],
          bad: 'Loop with <code>for _, s := range services</code> and use <code>if down[s]</code> to print only the ones that are down.',
          good: 'That\'s the whole report.' },
        { kind: 'finish', title: 'Finish line: short checks' }
      ]
    }
  ],

  goals: [
    { id: 'g1', node: 'py-err', who: 'Whole team', size: 6, othersDone: 3, due: '23.11.' },
    { id: 'g2', node: 'py-async', who: 'Whole team', size: 6, othersDone: 1, due: '15.12.' },
    { id: 'g3', node: 'ts-obj', who: 'Alex, Jonas, Priya', size: 3, othersDone: 1, due: '8.11.' },
    { id: 'g4', node: 'py-str', who: 'Alex', size: 1, othersDone: 0, due: '16.11.' },
    { id: 'g5', node: 'py-mod', who: 'Alex, Tom', size: 2, othersDone: 0, due: '23.11.' },
    { id: 'g6', node: 'py-oop', who: 'Whole team', size: 6, othersDone: 2, due: '30.11.' },
    { id: 'g7', node: 'ts-prom', who: 'Whole team', size: 6, othersDone: 0, due: '1.12.' }
  ],

  people: [
    { initials: 'JW', name: 'Jonas Weber', role: 'Backend', level: 'Lv 5 · Advanced', py: '10/13', ts: '3/9', go: '2/8', current: 'Generators', last: '21.10.' },
    { initials: 'PS', name: 'Priya Shah', role: 'Full stack', level: 'Lv 5 · Advanced', py: '8/13', ts: '5/9', go: '0/8', current: 'Objects & interfaces', last: '18.10.' },
    { initials: 'LM', name: 'Lena Moser', role: 'Platform', level: 'Lv 6 · Senior', py: '11/13', ts: '1/9', go: '6/8', current: 'Channels', last: '22.10.' },
    { initials: 'TB', name: 'Tom Brandt', role: 'Junior', level: 'Lv 2 · Beginner', py: '3/13', ts: '0/9', go: '0/8', current: 'Guided task · PLAT-398', last: '14.10.' },
    { initials: 'SN', name: 'Sara Novak', role: 'SRE', level: 'Lv 5 · Advanced', py: '7/13', ts: '0/9', go: '7/8', current: 'Async & await', last: '23.10.' }
  ],

  otherTask: {
    person: 'Tom Brandt', initials: 'TB', id: 'PLAT-398', title: 'CSV export for invoices', step: '1 of 5',
    concepts: [['Modules, files & JSON', 'teach'], ['Comprehensions', 'teach'], ['Error handling', 'added']]
  },

  activity: [
    { text: 'Maria Keller marked Functions (Python) as already known', when: '22.10.', kind: 'manager' },
    { text: 'Started guided task PLAT-412', when: '21.10.', kind: 'task' },
    { text: 'Verified Functions (TypeScript)', when: '9.10.', kind: 'verified' },
    { text: 'Verified Types & annotations (TypeScript)', when: '1.10.', kind: 'verified' }
  ]
};
