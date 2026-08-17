Agar interview **React Frontend / MERN / Node.js (4–6 years experience)** ka hai, to **90–95% chances** hain ki JavaScript ke questions inhi topics ke aas-paas honge. Lekin senior-level interviews mein kuch aur advanced topics bhi frequently poochte hain.

## Must Know (Ye almost fix hote hain)

- ✅ Execution Context
- ✅ Hoisting
- ✅ Scope & Closures
- ✅ `this` keyword
- ✅ Call, Apply, Bind
- ✅ Event Loop
- ✅ Promise & Async/Await
- ✅ Prototype & Inheritance
- ✅ Deep Copy vs Shallow Copy
- ✅ Debounce & Throttle
- ✅ Polyfills
- ✅ Memory Management & Garbage Collection

---

## 5 Years Experience ke liye aur kya pooch sakte hain?

### 1. Event Delegation ⭐⭐⭐⭐⭐

```javascript
document.getElementById("list").addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    console.log(e.target.innerText);
  }
});
```

**Question:**

- What is Event Delegation?
- Why is it used?
- Benefits?

---

### 2. Event Bubbling vs Capturing ⭐⭐⭐⭐⭐

Interviewer almost hamesha poochta hai.

- Bubbling
- Capturing
- stopPropagation()
- preventDefault()

---

### 3. Memory Leak ⭐⭐⭐⭐

Examples:

- Unremoved event listeners
- Unclosed timers (`setInterval`)
- Closures holding references
- Global variables

---

### 4. Object.freeze vs Seal vs PreventExtensions ⭐⭐⭐⭐

Difference explain karna.

---

### 5. Destructuring, Spread & Rest ⭐⭐⭐⭐

Difference between:

```javascript
...
```

Spread

vs

Rest

---

### 6. Map vs WeakMap ⭐⭐⭐⭐

Kab use karoge?

Why WeakMap exists?

---

### 7. Set vs WeakSet

---

### 8. Symbol

Why introduced?

---

### 9. Generators

```javascript
function* gen() {
  yield 1;
  yield 2;
}
```

---

### 10. Iterators

Difference:

- Iterable
- Iterator

---

### 11. Optional Chaining

```javascript
user?.address?.city;
```

---

### 12. Nullish Coalescing

```javascript
??
```

Difference from

```javascript
||
```

---

### 13. Array Methods

Difference:

- map
- forEach
- filter
- reduce
- some
- every
- find
- findIndex

---

### 14. Object.keys()

Object.values()

Object.entries()

---

### 15. Function Currying

---

### 16. Memoization

Implement

---

### 17. Function Composition

---

### 18. Recursion

---

### 19. Infinite Currying

```javascript
sum(1)(2)(3)(4)();
```

---

### 20. Polyfills

- map
- filter
- reduce
- bind
- Promise.all

---

## JavaScript Output Questions (Bahut Popular)

```javascript
console.log([] == ![]);
```

```javascript
console.log(typeof NaN);
```

```javascript
console.log(1 < 2 < 3);
```

```javascript
console.log(3 > 2 > 1);
```

```javascript
console.log([] + {});
```

```javascript
console.log({} + []);
```

```javascript
console.log("5" - 2);
```

```javascript
console.log("5" + 2);
```

```javascript
console.log(true + true);
```

```javascript
console.log(null == undefined);
```

```javascript
console.log(null === undefined);
```

---

## Agar React Interview Hai

JavaScript ke baad almost ye React topics aate hi hain:

- React Lifecycle
- Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`)
- Custom Hooks
- React.memo
- Virtual DOM
- Reconciliation
- Fiber
- Context API
- Redux Toolkit
- React Query / TanStack Query
- Performance Optimization
- Code Splitting
- Lazy Loading
- Suspense
- Error Boundaries
- Controlled vs Uncontrolled Components

---

### Mere hisaab se 5+ years ke interview ke liye priority order ye honi chahiye:

1. 🔥 JavaScript Core (Execution Context, Closures, Event Loop, Promises)
2. 🔥 JavaScript Coding (Polyfills, Debounce, Throttle, Currying)
3. 🔥 React Internals (Hooks, Reconciliation, Performance)
4. 🔥 Machine Coding (Todo, Search, Infinite Scroll, Modal, Table, Forms)
5. 🔥 System Design (Frontend Architecture, Caching, API Handling, State Management)

Agar tum **FAANG-level nahi balki product companies (Sureify, IBM, Deloitte, Accenture, TCS Digital, Razorpay, PhonePe, etc.)** target kar rahe ho, to in topics ko achhe se prepare kar loge to JavaScript section ke **95% interview questions** cover ho jayenge.
