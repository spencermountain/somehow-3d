
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        const z_index = (parseInt(computed_style.zIndex) || 0) - 1;
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', `display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ` +
            `overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: ${z_index};`);
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = `data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>`;
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const RENDERER = {};
    const LAYER = {};
    const PARENT = {};
    const CAMERA = {};

    function get_scene() {
    	return getContext(RENDERER);
    }

    function get_layer() {
    	return getContext(LAYER);
    }

    function get_parent() {
    	return getContext(PARENT);
    }

    function get_camera() {
    	return getContext(CAMERA);
    }

    function set_layer(layer) {
    	setContext(LAYER, layer);
    }

    function set_parent(parent) {
    	setContext(PARENT, parent);
    }

    function remove_index(array, index) {
    	array[index] = array[array.length - 1];
    	array.pop();
    }

    function remove_item(array, item) {
    	const index = array.indexOf(item);
    	if (~index) remove_index(array, index);
    }

    function create_layer(index, invalidate) {
    	let child_index = 0;

    	const meshes = [];
    	const transparent_meshes = [];
    	const child_layers = [];

    	const layer = {
    		index: 0,
    		meshes,
    		transparent_meshes,
    		child_layers,
    		needs_sort: false,
    		needs_transparency_sort: true,
    		add_mesh: (mesh, existing) => {
    			if (existing) {
    				remove_item(mesh.transparent ? meshes : transparent_meshes, mesh);
    			}

    			if (mesh.transparent) {
    				transparent_meshes.push(mesh);
    				layer.needs_transparency_sort = true;
    			} else {
    				meshes.push(mesh);
    			}

    			onDestroy(() => {
    				remove_item(meshes, mesh);
    				remove_item(transparent_meshes, mesh);
    				invalidate();
    			});
    		},
    		add_child: (index = child_index++) => {
    			const child_layer = create_layer(index, invalidate);
    			child_layers.push(child_layer);

    			layer.needs_sort = true;

    			onDestroy(() => {
    				remove_item(child_layers, child_layer);

    				layer.needs_sort = true;
    				invalidate();
    			});

    			return child_layer;
    		}
    	};

    	return layer;
    }

    function process_color(color) {
    	if (typeof color === 'number') {
    		const r = (color & 0xff0000) >> 16;
    		const g = (color & 0x00ff00) >> 8;
    		const b = (color & 0x0000ff);

    		return new Float32Array([
    			r / 255,
    			g / 255,
    			b / 255
    		]);
    	}

    	return color;
    }

    function normalize(out, vector = out) {
    	let total = 0;
    	for (let i = 0; i < vector.length; i += 1) {
    		total += vector[i] * vector[i];
    	}

    	const mag = Math.sqrt(total);

    	out[0] = vector[0] / mag;
    	out[1] = vector[1] / mag;
    	out[2] = vector[2] / mag;

    	return out;
    }

    function create_worker(url, fn) {
    	const worker = new Worker(url);
    	const code = fn.toString().replace(/^(function.+?|.+?=>\s*)\{/g, '').slice(0, -1);

    	worker.postMessage(code);

    	return worker;
    }

    function memoize(fn) {
    	const cache = new Map();
    	return (...args) => {
    		const hash = JSON.stringify(args);
    		if (!cache.has(hash)) cache.set(hash, fn(...args));
    		return cache.get(hash);
    	};
    }

    /**
     * Common utilities
     * @module glMatrix
     */
    // Configuration Constants
    var EPSILON = 0.000001;
    var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
    var RANDOM = Math.random;
    if (!Math.hypot) Math.hypot = function () {
      var y = 0,
          i = arguments.length;

      while (i--) {
        y += arguments[i] * arguments[i];
      }

      return Math.sqrt(y);
    };

    /**
     * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
     * @module mat4
     */

    /**
     * Creates a new identity mat4
     *
     * @returns {mat4} a new 4x4 matrix
     */

    function create() {
      var out = new ARRAY_TYPE(16);

      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
      }

      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a new mat4 initialized with values from an existing matrix
     *
     * @param {ReadonlyMat4} a matrix to clone
     * @returns {mat4} a new 4x4 matrix
     */

    function clone(a) {
      var out = new ARRAY_TYPE(16);
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[8] = a[8];
      out[9] = a[9];
      out[10] = a[10];
      out[11] = a[11];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
      return out;
    }
    /**
     * Copy the values from one mat4 to another
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function copy(out, a) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[8] = a[8];
      out[9] = a[9];
      out[10] = a[10];
      out[11] = a[11];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
      return out;
    }
    /**
     * Create a new mat4 with the given values
     *
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m02 Component in column 0, row 2 position (index 2)
     * @param {Number} m03 Component in column 0, row 3 position (index 3)
     * @param {Number} m10 Component in column 1, row 0 position (index 4)
     * @param {Number} m11 Component in column 1, row 1 position (index 5)
     * @param {Number} m12 Component in column 1, row 2 position (index 6)
     * @param {Number} m13 Component in column 1, row 3 position (index 7)
     * @param {Number} m20 Component in column 2, row 0 position (index 8)
     * @param {Number} m21 Component in column 2, row 1 position (index 9)
     * @param {Number} m22 Component in column 2, row 2 position (index 10)
     * @param {Number} m23 Component in column 2, row 3 position (index 11)
     * @param {Number} m30 Component in column 3, row 0 position (index 12)
     * @param {Number} m31 Component in column 3, row 1 position (index 13)
     * @param {Number} m32 Component in column 3, row 2 position (index 14)
     * @param {Number} m33 Component in column 3, row 3 position (index 15)
     * @returns {mat4} A new mat4
     */

    function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
      var out = new ARRAY_TYPE(16);
      out[0] = m00;
      out[1] = m01;
      out[2] = m02;
      out[3] = m03;
      out[4] = m10;
      out[5] = m11;
      out[6] = m12;
      out[7] = m13;
      out[8] = m20;
      out[9] = m21;
      out[10] = m22;
      out[11] = m23;
      out[12] = m30;
      out[13] = m31;
      out[14] = m32;
      out[15] = m33;
      return out;
    }
    /**
     * Set the components of a mat4 to the given values
     *
     * @param {mat4} out the receiving matrix
     * @param {Number} m00 Component in column 0, row 0 position (index 0)
     * @param {Number} m01 Component in column 0, row 1 position (index 1)
     * @param {Number} m02 Component in column 0, row 2 position (index 2)
     * @param {Number} m03 Component in column 0, row 3 position (index 3)
     * @param {Number} m10 Component in column 1, row 0 position (index 4)
     * @param {Number} m11 Component in column 1, row 1 position (index 5)
     * @param {Number} m12 Component in column 1, row 2 position (index 6)
     * @param {Number} m13 Component in column 1, row 3 position (index 7)
     * @param {Number} m20 Component in column 2, row 0 position (index 8)
     * @param {Number} m21 Component in column 2, row 1 position (index 9)
     * @param {Number} m22 Component in column 2, row 2 position (index 10)
     * @param {Number} m23 Component in column 2, row 3 position (index 11)
     * @param {Number} m30 Component in column 3, row 0 position (index 12)
     * @param {Number} m31 Component in column 3, row 1 position (index 13)
     * @param {Number} m32 Component in column 3, row 2 position (index 14)
     * @param {Number} m33 Component in column 3, row 3 position (index 15)
     * @returns {mat4} out
     */

    function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
      out[0] = m00;
      out[1] = m01;
      out[2] = m02;
      out[3] = m03;
      out[4] = m10;
      out[5] = m11;
      out[6] = m12;
      out[7] = m13;
      out[8] = m20;
      out[9] = m21;
      out[10] = m22;
      out[11] = m23;
      out[12] = m30;
      out[13] = m31;
      out[14] = m32;
      out[15] = m33;
      return out;
    }
    /**
     * Set a mat4 to the identity matrix
     *
     * @param {mat4} out the receiving matrix
     * @returns {mat4} out
     */

    function identity(out) {
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Transpose the values of a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function transpose(out, a) {
      // If we are transposing ourselves we can skip a few steps but have to cache some values
      if (out === a) {
        var a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        var a12 = a[6],
            a13 = a[7];
        var a23 = a[11];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
      } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
      }

      return out;
    }
    /**
     * Inverts a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function invert(out, a) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];
      var b00 = a00 * a11 - a01 * a10;
      var b01 = a00 * a12 - a02 * a10;
      var b02 = a00 * a13 - a03 * a10;
      var b03 = a01 * a12 - a02 * a11;
      var b04 = a01 * a13 - a03 * a11;
      var b05 = a02 * a13 - a03 * a12;
      var b06 = a20 * a31 - a21 * a30;
      var b07 = a20 * a32 - a22 * a30;
      var b08 = a20 * a33 - a23 * a30;
      var b09 = a21 * a32 - a22 * a31;
      var b10 = a21 * a33 - a23 * a31;
      var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

      var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

      if (!det) {
        return null;
      }

      det = 1.0 / det;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return out;
    }
    /**
     * Calculates the adjugate of a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function adjoint(out, a) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];
      out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
      out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
      out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
      out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
      out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
      out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
      out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
      out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
      out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
      out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
      out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
      out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
      out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
      out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
      out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
      out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
      return out;
    }
    /**
     * Calculates the determinant of a mat4
     *
     * @param {ReadonlyMat4} a the source matrix
     * @returns {Number} determinant of a
     */

    function determinant(a) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];
      var b00 = a00 * a11 - a01 * a10;
      var b01 = a00 * a12 - a02 * a10;
      var b02 = a00 * a13 - a03 * a10;
      var b03 = a01 * a12 - a02 * a11;
      var b04 = a01 * a13 - a03 * a11;
      var b05 = a02 * a13 - a03 * a12;
      var b06 = a20 * a31 - a21 * a30;
      var b07 = a20 * a32 - a22 * a30;
      var b08 = a20 * a33 - a23 * a30;
      var b09 = a21 * a32 - a22 * a31;
      var b10 = a21 * a33 - a23 * a31;
      var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

      return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    }
    /**
     * Multiplies two mat4s
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the first operand
     * @param {ReadonlyMat4} b the second operand
     * @returns {mat4} out
     */

    function multiply(out, a, b) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15]; // Cache only the current line of the second matrix

      var b0 = b[0],
          b1 = b[1],
          b2 = b[2],
          b3 = b[3];
      out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[4];
      b1 = b[5];
      b2 = b[6];
      b3 = b[7];
      out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[8];
      b1 = b[9];
      b2 = b[10];
      b3 = b[11];
      out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[12];
      b1 = b[13];
      b2 = b[14];
      b3 = b[15];
      out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      return out;
    }
    /**
     * Translate a mat4 by the given vector
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to translate
     * @param {ReadonlyVec3} v vector to translate by
     * @returns {mat4} out
     */

    function translate(out, a, v) {
      var x = v[0],
          y = v[1],
          z = v[2];
      var a00, a01, a02, a03;
      var a10, a11, a12, a13;
      var a20, a21, a22, a23;

      if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      } else {
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a10 = a[4];
        a11 = a[5];
        a12 = a[6];
        a13 = a[7];
        a20 = a[8];
        a21 = a[9];
        a22 = a[10];
        a23 = a[11];
        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a03;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a20;
        out[9] = a21;
        out[10] = a22;
        out[11] = a23;
        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
      }

      return out;
    }
    /**
     * Scales the mat4 by the dimensions in the given vec3 not using vectorization
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to scale
     * @param {ReadonlyVec3} v the vec3 to scale the matrix by
     * @returns {mat4} out
     **/

    function scale(out, a, v) {
      var x = v[0],
          y = v[1],
          z = v[2];
      out[0] = a[0] * x;
      out[1] = a[1] * x;
      out[2] = a[2] * x;
      out[3] = a[3] * x;
      out[4] = a[4] * y;
      out[5] = a[5] * y;
      out[6] = a[6] * y;
      out[7] = a[7] * y;
      out[8] = a[8] * z;
      out[9] = a[9] * z;
      out[10] = a[10] * z;
      out[11] = a[11] * z;
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
      return out;
    }
    /**
     * Rotates a mat4 by the given angle around the given axis
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @param {ReadonlyVec3} axis the axis to rotate around
     * @returns {mat4} out
     */

    function rotate(out, a, rad, axis) {
      var x = axis[0],
          y = axis[1],
          z = axis[2];
      var len = Math.hypot(x, y, z);
      var s, c, t;
      var a00, a01, a02, a03;
      var a10, a11, a12, a13;
      var a20, a21, a22, a23;
      var b00, b01, b02;
      var b10, b11, b12;
      var b20, b21, b22;

      if (len < EPSILON) {
        return null;
      }

      len = 1 / len;
      x *= len;
      y *= len;
      z *= len;
      s = Math.sin(rad);
      c = Math.cos(rad);
      t = 1 - c;
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11]; // Construct the elements of the rotation matrix

      b00 = x * x * t + c;
      b01 = y * x * t + z * s;
      b02 = z * x * t - y * s;
      b10 = x * y * t - z * s;
      b11 = y * y * t + c;
      b12 = z * y * t + x * s;
      b20 = x * z * t + y * s;
      b21 = y * z * t - x * s;
      b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

      out[0] = a00 * b00 + a10 * b01 + a20 * b02;
      out[1] = a01 * b00 + a11 * b01 + a21 * b02;
      out[2] = a02 * b00 + a12 * b01 + a22 * b02;
      out[3] = a03 * b00 + a13 * b01 + a23 * b02;
      out[4] = a00 * b10 + a10 * b11 + a20 * b12;
      out[5] = a01 * b10 + a11 * b11 + a21 * b12;
      out[6] = a02 * b10 + a12 * b11 + a22 * b12;
      out[7] = a03 * b10 + a13 * b11 + a23 * b12;
      out[8] = a00 * b20 + a10 * b21 + a20 * b22;
      out[9] = a01 * b20 + a11 * b21 + a21 * b22;
      out[10] = a02 * b20 + a12 * b21 + a22 * b22;
      out[11] = a03 * b20 + a13 * b21 + a23 * b22;

      if (a !== out) {
        // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
      }

      return out;
    }
    /**
     * Rotates a matrix by the given angle around the X axis
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */

    function rotateX(out, a, rad) {
      var s = Math.sin(rad);
      var c = Math.cos(rad);
      var a10 = a[4];
      var a11 = a[5];
      var a12 = a[6];
      var a13 = a[7];
      var a20 = a[8];
      var a21 = a[9];
      var a22 = a[10];
      var a23 = a[11];

      if (a !== out) {
        // If the source and destination differ, copy the unchanged rows
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
      } // Perform axis-specific matrix multiplication


      out[4] = a10 * c + a20 * s;
      out[5] = a11 * c + a21 * s;
      out[6] = a12 * c + a22 * s;
      out[7] = a13 * c + a23 * s;
      out[8] = a20 * c - a10 * s;
      out[9] = a21 * c - a11 * s;
      out[10] = a22 * c - a12 * s;
      out[11] = a23 * c - a13 * s;
      return out;
    }
    /**
     * Rotates a matrix by the given angle around the Y axis
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */

    function rotateY(out, a, rad) {
      var s = Math.sin(rad);
      var c = Math.cos(rad);
      var a00 = a[0];
      var a01 = a[1];
      var a02 = a[2];
      var a03 = a[3];
      var a20 = a[8];
      var a21 = a[9];
      var a22 = a[10];
      var a23 = a[11];

      if (a !== out) {
        // If the source and destination differ, copy the unchanged rows
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
      } // Perform axis-specific matrix multiplication


      out[0] = a00 * c - a20 * s;
      out[1] = a01 * c - a21 * s;
      out[2] = a02 * c - a22 * s;
      out[3] = a03 * c - a23 * s;
      out[8] = a00 * s + a20 * c;
      out[9] = a01 * s + a21 * c;
      out[10] = a02 * s + a22 * c;
      out[11] = a03 * s + a23 * c;
      return out;
    }
    /**
     * Rotates a matrix by the given angle around the Z axis
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */

    function rotateZ(out, a, rad) {
      var s = Math.sin(rad);
      var c = Math.cos(rad);
      var a00 = a[0];
      var a01 = a[1];
      var a02 = a[2];
      var a03 = a[3];
      var a10 = a[4];
      var a11 = a[5];
      var a12 = a[6];
      var a13 = a[7];

      if (a !== out) {
        // If the source and destination differ, copy the unchanged last row
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
      } // Perform axis-specific matrix multiplication


      out[0] = a00 * c + a10 * s;
      out[1] = a01 * c + a11 * s;
      out[2] = a02 * c + a12 * s;
      out[3] = a03 * c + a13 * s;
      out[4] = a10 * c - a00 * s;
      out[5] = a11 * c - a01 * s;
      out[6] = a12 * c - a02 * s;
      out[7] = a13 * c - a03 * s;
      return out;
    }
    /**
     * Creates a matrix from a vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, dest, vec);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {ReadonlyVec3} v Translation vector
     * @returns {mat4} out
     */

    function fromTranslation(out, v) {
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = v[0];
      out[13] = v[1];
      out[14] = v[2];
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from a vector scaling
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.scale(dest, dest, vec);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {ReadonlyVec3} v Scaling vector
     * @returns {mat4} out
     */

    function fromScaling(out, v) {
      out[0] = v[0];
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = v[1];
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = v[2];
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from a given angle around a given axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotate(dest, dest, rad, axis);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @param {ReadonlyVec3} axis the axis to rotate around
     * @returns {mat4} out
     */

    function fromRotation(out, rad, axis) {
      var x = axis[0],
          y = axis[1],
          z = axis[2];
      var len = Math.hypot(x, y, z);
      var s, c, t;

      if (len < EPSILON) {
        return null;
      }

      len = 1 / len;
      x *= len;
      y *= len;
      z *= len;
      s = Math.sin(rad);
      c = Math.cos(rad);
      t = 1 - c; // Perform rotation-specific matrix multiplication

      out[0] = x * x * t + c;
      out[1] = y * x * t + z * s;
      out[2] = z * x * t - y * s;
      out[3] = 0;
      out[4] = x * y * t - z * s;
      out[5] = y * y * t + c;
      out[6] = z * y * t + x * s;
      out[7] = 0;
      out[8] = x * z * t + y * s;
      out[9] = y * z * t - x * s;
      out[10] = z * z * t + c;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from the given angle around the X axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateX(dest, dest, rad);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */

    function fromXRotation(out, rad) {
      var s = Math.sin(rad);
      var c = Math.cos(rad); // Perform axis-specific matrix multiplication

      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = c;
      out[6] = s;
      out[7] = 0;
      out[8] = 0;
      out[9] = -s;
      out[10] = c;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from the given angle around the Y axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateY(dest, dest, rad);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */

    function fromYRotation(out, rad) {
      var s = Math.sin(rad);
      var c = Math.cos(rad); // Perform axis-specific matrix multiplication

      out[0] = c;
      out[1] = 0;
      out[2] = -s;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = s;
      out[9] = 0;
      out[10] = c;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from the given angle around the Z axis
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.rotateZ(dest, dest, rad);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {Number} rad the angle to rotate the matrix by
     * @returns {mat4} out
     */

    function fromZRotation(out, rad) {
      var s = Math.sin(rad);
      var c = Math.cos(rad); // Perform axis-specific matrix multiplication

      out[0] = c;
      out[1] = s;
      out[2] = 0;
      out[3] = 0;
      out[4] = -s;
      out[5] = c;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from a quaternion rotation and vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     let quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {quat4} q Rotation quaternion
     * @param {ReadonlyVec3} v Translation vector
     * @returns {mat4} out
     */

    function fromRotationTranslation(out, q, v) {
      // Quaternion math
      var x = q[0],
          y = q[1],
          z = q[2],
          w = q[3];
      var x2 = x + x;
      var y2 = y + y;
      var z2 = z + z;
      var xx = x * x2;
      var xy = x * y2;
      var xz = x * z2;
      var yy = y * y2;
      var yz = y * z2;
      var zz = z * z2;
      var wx = w * x2;
      var wy = w * y2;
      var wz = w * z2;
      out[0] = 1 - (yy + zz);
      out[1] = xy + wz;
      out[2] = xz - wy;
      out[3] = 0;
      out[4] = xy - wz;
      out[5] = 1 - (xx + zz);
      out[6] = yz + wx;
      out[7] = 0;
      out[8] = xz + wy;
      out[9] = yz - wx;
      out[10] = 1 - (xx + yy);
      out[11] = 0;
      out[12] = v[0];
      out[13] = v[1];
      out[14] = v[2];
      out[15] = 1;
      return out;
    }
    /**
     * Creates a new mat4 from a dual quat.
     *
     * @param {mat4} out Matrix
     * @param {ReadonlyQuat2} a Dual Quaternion
     * @returns {mat4} mat4 receiving operation result
     */

    function fromQuat2(out, a) {
      var translation = new ARRAY_TYPE(3);
      var bx = -a[0],
          by = -a[1],
          bz = -a[2],
          bw = a[3],
          ax = a[4],
          ay = a[5],
          az = a[6],
          aw = a[7];
      var magnitude = bx * bx + by * by + bz * bz + bw * bw; //Only scale if it makes sense

      if (magnitude > 0) {
        translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
        translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
        translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
      } else {
        translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
        translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
        translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
      }

      fromRotationTranslation(out, a, translation);
      return out;
    }
    /**
     * Returns the translation vector component of a transformation
     *  matrix. If a matrix is built with fromRotationTranslation,
     *  the returned vector will be the same as the translation vector
     *  originally supplied.
     * @param  {vec3} out Vector to receive translation component
     * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
     * @return {vec3} out
     */

    function getTranslation(out, mat) {
      out[0] = mat[12];
      out[1] = mat[13];
      out[2] = mat[14];
      return out;
    }
    /**
     * Returns the scaling factor component of a transformation
     *  matrix. If a matrix is built with fromRotationTranslationScale
     *  with a normalized Quaternion paramter, the returned vector will be
     *  the same as the scaling vector
     *  originally supplied.
     * @param  {vec3} out Vector to receive scaling factor component
     * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
     * @return {vec3} out
     */

    function getScaling(out, mat) {
      var m11 = mat[0];
      var m12 = mat[1];
      var m13 = mat[2];
      var m21 = mat[4];
      var m22 = mat[5];
      var m23 = mat[6];
      var m31 = mat[8];
      var m32 = mat[9];
      var m33 = mat[10];
      out[0] = Math.hypot(m11, m12, m13);
      out[1] = Math.hypot(m21, m22, m23);
      out[2] = Math.hypot(m31, m32, m33);
      return out;
    }
    /**
     * Returns a quaternion representing the rotational component
     *  of a transformation matrix. If a matrix is built with
     *  fromRotationTranslation, the returned quaternion will be the
     *  same as the quaternion originally supplied.
     * @param {quat} out Quaternion to receive the rotation component
     * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
     * @return {quat} out
     */

    function getRotation(out, mat) {
      var scaling = new ARRAY_TYPE(3);
      getScaling(scaling, mat);
      var is1 = 1 / scaling[0];
      var is2 = 1 / scaling[1];
      var is3 = 1 / scaling[2];
      var sm11 = mat[0] * is1;
      var sm12 = mat[1] * is2;
      var sm13 = mat[2] * is3;
      var sm21 = mat[4] * is1;
      var sm22 = mat[5] * is2;
      var sm23 = mat[6] * is3;
      var sm31 = mat[8] * is1;
      var sm32 = mat[9] * is2;
      var sm33 = mat[10] * is3;
      var trace = sm11 + sm22 + sm33;
      var S = 0;

      if (trace > 0) {
        S = Math.sqrt(trace + 1.0) * 2;
        out[3] = 0.25 * S;
        out[0] = (sm23 - sm32) / S;
        out[1] = (sm31 - sm13) / S;
        out[2] = (sm12 - sm21) / S;
      } else if (sm11 > sm22 && sm11 > sm33) {
        S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
        out[3] = (sm23 - sm32) / S;
        out[0] = 0.25 * S;
        out[1] = (sm12 + sm21) / S;
        out[2] = (sm31 + sm13) / S;
      } else if (sm22 > sm33) {
        S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
        out[3] = (sm31 - sm13) / S;
        out[0] = (sm12 + sm21) / S;
        out[1] = 0.25 * S;
        out[2] = (sm23 + sm32) / S;
      } else {
        S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
        out[3] = (sm12 - sm21) / S;
        out[0] = (sm31 + sm13) / S;
        out[1] = (sm23 + sm32) / S;
        out[2] = 0.25 * S;
      }

      return out;
    }
    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     let quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *     mat4.scale(dest, scale)
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {quat4} q Rotation quaternion
     * @param {ReadonlyVec3} v Translation vector
     * @param {ReadonlyVec3} s Scaling vector
     * @returns {mat4} out
     */

    function fromRotationTranslationScale(out, q, v, s) {
      // Quaternion math
      var x = q[0],
          y = q[1],
          z = q[2],
          w = q[3];
      var x2 = x + x;
      var y2 = y + y;
      var z2 = z + z;
      var xx = x * x2;
      var xy = x * y2;
      var xz = x * z2;
      var yy = y * y2;
      var yz = y * z2;
      var zz = z * z2;
      var wx = w * x2;
      var wy = w * y2;
      var wz = w * z2;
      var sx = s[0];
      var sy = s[1];
      var sz = s[2];
      out[0] = (1 - (yy + zz)) * sx;
      out[1] = (xy + wz) * sx;
      out[2] = (xz - wy) * sx;
      out[3] = 0;
      out[4] = (xy - wz) * sy;
      out[5] = (1 - (xx + zz)) * sy;
      out[6] = (yz + wx) * sy;
      out[7] = 0;
      out[8] = (xz + wy) * sz;
      out[9] = (yz - wx) * sz;
      out[10] = (1 - (xx + yy)) * sz;
      out[11] = 0;
      out[12] = v[0];
      out[13] = v[1];
      out[14] = v[2];
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, vec);
     *     mat4.translate(dest, origin);
     *     let quatMat = mat4.create();
     *     quat4.toMat4(quat, quatMat);
     *     mat4.multiply(dest, quatMat);
     *     mat4.scale(dest, scale)
     *     mat4.translate(dest, negativeOrigin);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {quat4} q Rotation quaternion
     * @param {ReadonlyVec3} v Translation vector
     * @param {ReadonlyVec3} s Scaling vector
     * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
     * @returns {mat4} out
     */

    function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
      // Quaternion math
      var x = q[0],
          y = q[1],
          z = q[2],
          w = q[3];
      var x2 = x + x;
      var y2 = y + y;
      var z2 = z + z;
      var xx = x * x2;
      var xy = x * y2;
      var xz = x * z2;
      var yy = y * y2;
      var yz = y * z2;
      var zz = z * z2;
      var wx = w * x2;
      var wy = w * y2;
      var wz = w * z2;
      var sx = s[0];
      var sy = s[1];
      var sz = s[2];
      var ox = o[0];
      var oy = o[1];
      var oz = o[2];
      var out0 = (1 - (yy + zz)) * sx;
      var out1 = (xy + wz) * sx;
      var out2 = (xz - wy) * sx;
      var out4 = (xy - wz) * sy;
      var out5 = (1 - (xx + zz)) * sy;
      var out6 = (yz + wx) * sy;
      var out8 = (xz + wy) * sz;
      var out9 = (yz - wx) * sz;
      var out10 = (1 - (xx + yy)) * sz;
      out[0] = out0;
      out[1] = out1;
      out[2] = out2;
      out[3] = 0;
      out[4] = out4;
      out[5] = out5;
      out[6] = out6;
      out[7] = 0;
      out[8] = out8;
      out[9] = out9;
      out[10] = out10;
      out[11] = 0;
      out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
      out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
      out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
      out[15] = 1;
      return out;
    }
    /**
     * Calculates a 4x4 matrix from the given quaternion
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {ReadonlyQuat} q Quaternion to create matrix from
     *
     * @returns {mat4} out
     */

    function fromQuat(out, q) {
      var x = q[0],
          y = q[1],
          z = q[2],
          w = q[3];
      var x2 = x + x;
      var y2 = y + y;
      var z2 = z + z;
      var xx = x * x2;
      var yx = y * x2;
      var yy = y * y2;
      var zx = z * x2;
      var zy = z * y2;
      var zz = z * z2;
      var wx = w * x2;
      var wy = w * y2;
      var wz = w * z2;
      out[0] = 1 - yy - zz;
      out[1] = yx + wz;
      out[2] = zx - wy;
      out[3] = 0;
      out[4] = yx - wz;
      out[5] = 1 - xx - zz;
      out[6] = zy + wx;
      out[7] = 0;
      out[8] = zx + wy;
      out[9] = zy - wx;
      out[10] = 1 - xx - yy;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }
    /**
     * Generates a frustum matrix with the given bounds
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {Number} left Left bound of the frustum
     * @param {Number} right Right bound of the frustum
     * @param {Number} bottom Bottom bound of the frustum
     * @param {Number} top Top bound of the frustum
     * @param {Number} near Near bound of the frustum
     * @param {Number} far Far bound of the frustum
     * @returns {mat4} out
     */

    function frustum(out, left, right, bottom, top, near, far) {
      var rl = 1 / (right - left);
      var tb = 1 / (top - bottom);
      var nf = 1 / (near - far);
      out[0] = near * 2 * rl;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = near * 2 * tb;
      out[6] = 0;
      out[7] = 0;
      out[8] = (right + left) * rl;
      out[9] = (top + bottom) * tb;
      out[10] = (far + near) * nf;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[14] = far * near * 2 * nf;
      out[15] = 0;
      return out;
    }
    /**
     * Generates a perspective projection matrix with the given bounds.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {number} fovy Vertical field of view in radians
     * @param {number} aspect Aspect ratio. typically viewport width/height
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum, can be null or Infinity
     * @returns {mat4} out
     */

    function perspective(out, fovy, aspect, near, far) {
      var f = 1.0 / Math.tan(fovy / 2),
          nf;
      out[0] = f / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;

      if (far != null && far !== Infinity) {
        nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = 2 * far * near * nf;
      } else {
        out[10] = -1;
        out[14] = -2 * near;
      }

      return out;
    }
    /**
     * Generates a perspective projection matrix with the given field of view.
     * This is primarily useful for generating projection matrices to be used
     * with the still experiemental WebVR API.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @returns {mat4} out
     */

    function perspectiveFromFieldOfView(out, fov, near, far) {
      var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
      var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
      var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
      var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
      var xScale = 2.0 / (leftTan + rightTan);
      var yScale = 2.0 / (upTan + downTan);
      out[0] = xScale;
      out[1] = 0.0;
      out[2] = 0.0;
      out[3] = 0.0;
      out[4] = 0.0;
      out[5] = yScale;
      out[6] = 0.0;
      out[7] = 0.0;
      out[8] = -((leftTan - rightTan) * xScale * 0.5);
      out[9] = (upTan - downTan) * yScale * 0.5;
      out[10] = far / (near - far);
      out[11] = -1.0;
      out[12] = 0.0;
      out[13] = 0.0;
      out[14] = far * near / (near - far);
      out[15] = 0.0;
      return out;
    }
    /**
     * Generates a orthogonal projection matrix with the given bounds
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {number} left Left bound of the frustum
     * @param {number} right Right bound of the frustum
     * @param {number} bottom Bottom bound of the frustum
     * @param {number} top Top bound of the frustum
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     * @returns {mat4} out
     */

    function ortho(out, left, right, bottom, top, near, far) {
      var lr = 1 / (left - right);
      var bt = 1 / (bottom - top);
      var nf = 1 / (near - far);
      out[0] = -2 * lr;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = -2 * bt;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 2 * nf;
      out[11] = 0;
      out[12] = (left + right) * lr;
      out[13] = (top + bottom) * bt;
      out[14] = (far + near) * nf;
      out[15] = 1;
      return out;
    }
    /**
     * Generates a look-at matrix with the given eye position, focal point, and up axis.
     * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {ReadonlyVec3} eye Position of the viewer
     * @param {ReadonlyVec3} center Point the viewer is looking at
     * @param {ReadonlyVec3} up vec3 pointing up
     * @returns {mat4} out
     */

    function lookAt(out, eye, center, up) {
      var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
      var eyex = eye[0];
      var eyey = eye[1];
      var eyez = eye[2];
      var upx = up[0];
      var upy = up[1];
      var upz = up[2];
      var centerx = center[0];
      var centery = center[1];
      var centerz = center[2];

      if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
        return identity(out);
      }

      z0 = eyex - centerx;
      z1 = eyey - centery;
      z2 = eyez - centerz;
      len = 1 / Math.hypot(z0, z1, z2);
      z0 *= len;
      z1 *= len;
      z2 *= len;
      x0 = upy * z2 - upz * z1;
      x1 = upz * z0 - upx * z2;
      x2 = upx * z1 - upy * z0;
      len = Math.hypot(x0, x1, x2);

      if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
      } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
      }

      y0 = z1 * x2 - z2 * x1;
      y1 = z2 * x0 - z0 * x2;
      y2 = z0 * x1 - z1 * x0;
      len = Math.hypot(y0, y1, y2);

      if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
      } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
      }

      out[0] = x0;
      out[1] = y0;
      out[2] = z0;
      out[3] = 0;
      out[4] = x1;
      out[5] = y1;
      out[6] = z1;
      out[7] = 0;
      out[8] = x2;
      out[9] = y2;
      out[10] = z2;
      out[11] = 0;
      out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
      out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
      out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
      out[15] = 1;
      return out;
    }
    /**
     * Generates a matrix that makes something look at something else.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {ReadonlyVec3} eye Position of the viewer
     * @param {ReadonlyVec3} center Point the viewer is looking at
     * @param {ReadonlyVec3} up vec3 pointing up
     * @returns {mat4} out
     */

    function targetTo(out, eye, target, up) {
      var eyex = eye[0],
          eyey = eye[1],
          eyez = eye[2],
          upx = up[0],
          upy = up[1],
          upz = up[2];
      var z0 = eyex - target[0],
          z1 = eyey - target[1],
          z2 = eyez - target[2];
      var len = z0 * z0 + z1 * z1 + z2 * z2;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
        z0 *= len;
        z1 *= len;
        z2 *= len;
      }

      var x0 = upy * z2 - upz * z1,
          x1 = upz * z0 - upx * z2,
          x2 = upx * z1 - upy * z0;
      len = x0 * x0 + x1 * x1 + x2 * x2;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
        x0 *= len;
        x1 *= len;
        x2 *= len;
      }

      out[0] = x0;
      out[1] = x1;
      out[2] = x2;
      out[3] = 0;
      out[4] = z1 * x2 - z2 * x1;
      out[5] = z2 * x0 - z0 * x2;
      out[6] = z0 * x1 - z1 * x0;
      out[7] = 0;
      out[8] = z0;
      out[9] = z1;
      out[10] = z2;
      out[11] = 0;
      out[12] = eyex;
      out[13] = eyey;
      out[14] = eyez;
      out[15] = 1;
      return out;
    }
    /**
     * Returns a string representation of a mat4
     *
     * @param {ReadonlyMat4} a matrix to represent as a string
     * @returns {String} string representation of the matrix
     */

    function str(a) {
      return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
    }
    /**
     * Returns Frobenius norm of a mat4
     *
     * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
     * @returns {Number} Frobenius norm
     */

    function frob(a) {
      return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
    }
    /**
     * Adds two mat4's
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the first operand
     * @param {ReadonlyMat4} b the second operand
     * @returns {mat4} out
     */

    function add(out, a, b) {
      out[0] = a[0] + b[0];
      out[1] = a[1] + b[1];
      out[2] = a[2] + b[2];
      out[3] = a[3] + b[3];
      out[4] = a[4] + b[4];
      out[5] = a[5] + b[5];
      out[6] = a[6] + b[6];
      out[7] = a[7] + b[7];
      out[8] = a[8] + b[8];
      out[9] = a[9] + b[9];
      out[10] = a[10] + b[10];
      out[11] = a[11] + b[11];
      out[12] = a[12] + b[12];
      out[13] = a[13] + b[13];
      out[14] = a[14] + b[14];
      out[15] = a[15] + b[15];
      return out;
    }
    /**
     * Subtracts matrix b from matrix a
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the first operand
     * @param {ReadonlyMat4} b the second operand
     * @returns {mat4} out
     */

    function subtract(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      out[2] = a[2] - b[2];
      out[3] = a[3] - b[3];
      out[4] = a[4] - b[4];
      out[5] = a[5] - b[5];
      out[6] = a[6] - b[6];
      out[7] = a[7] - b[7];
      out[8] = a[8] - b[8];
      out[9] = a[9] - b[9];
      out[10] = a[10] - b[10];
      out[11] = a[11] - b[11];
      out[12] = a[12] - b[12];
      out[13] = a[13] - b[13];
      out[14] = a[14] - b[14];
      out[15] = a[15] - b[15];
      return out;
    }
    /**
     * Multiply each element of the matrix by a scalar.
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to scale
     * @param {Number} b amount to scale the matrix's elements by
     * @returns {mat4} out
     */

    function multiplyScalar(out, a, b) {
      out[0] = a[0] * b;
      out[1] = a[1] * b;
      out[2] = a[2] * b;
      out[3] = a[3] * b;
      out[4] = a[4] * b;
      out[5] = a[5] * b;
      out[6] = a[6] * b;
      out[7] = a[7] * b;
      out[8] = a[8] * b;
      out[9] = a[9] * b;
      out[10] = a[10] * b;
      out[11] = a[11] * b;
      out[12] = a[12] * b;
      out[13] = a[13] * b;
      out[14] = a[14] * b;
      out[15] = a[15] * b;
      return out;
    }
    /**
     * Adds two mat4's after multiplying each element of the second operand by a scalar value.
     *
     * @param {mat4} out the receiving vector
     * @param {ReadonlyMat4} a the first operand
     * @param {ReadonlyMat4} b the second operand
     * @param {Number} scale the amount to scale b's elements by before adding
     * @returns {mat4} out
     */

    function multiplyScalarAndAdd(out, a, b, scale) {
      out[0] = a[0] + b[0] * scale;
      out[1] = a[1] + b[1] * scale;
      out[2] = a[2] + b[2] * scale;
      out[3] = a[3] + b[3] * scale;
      out[4] = a[4] + b[4] * scale;
      out[5] = a[5] + b[5] * scale;
      out[6] = a[6] + b[6] * scale;
      out[7] = a[7] + b[7] * scale;
      out[8] = a[8] + b[8] * scale;
      out[9] = a[9] + b[9] * scale;
      out[10] = a[10] + b[10] * scale;
      out[11] = a[11] + b[11] * scale;
      out[12] = a[12] + b[12] * scale;
      out[13] = a[13] + b[13] * scale;
      out[14] = a[14] + b[14] * scale;
      out[15] = a[15] + b[15] * scale;
      return out;
    }
    /**
     * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
     *
     * @param {ReadonlyMat4} a The first matrix.
     * @param {ReadonlyMat4} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */

    function exactEquals(a, b) {
      return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
    }
    /**
     * Returns whether or not the matrices have approximately the same elements in the same position.
     *
     * @param {ReadonlyMat4} a The first matrix.
     * @param {ReadonlyMat4} b The second matrix.
     * @returns {Boolean} True if the matrices are equal, false otherwise.
     */

    function equals(a, b) {
      var a0 = a[0],
          a1 = a[1],
          a2 = a[2],
          a3 = a[3];
      var a4 = a[4],
          a5 = a[5],
          a6 = a[6],
          a7 = a[7];
      var a8 = a[8],
          a9 = a[9],
          a10 = a[10],
          a11 = a[11];
      var a12 = a[12],
          a13 = a[13],
          a14 = a[14],
          a15 = a[15];
      var b0 = b[0],
          b1 = b[1],
          b2 = b[2],
          b3 = b[3];
      var b4 = b[4],
          b5 = b[5],
          b6 = b[6],
          b7 = b[7];
      var b8 = b[8],
          b9 = b[9],
          b10 = b[10],
          b11 = b[11];
      var b12 = b[12],
          b13 = b[13],
          b14 = b[14],
          b15 = b[15];
      return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
    }
    /**
     * Alias for {@link mat4.multiply}
     * @function
     */

    var mul = multiply;
    /**
     * Alias for {@link mat4.subtract}
     * @function
     */

    var sub = subtract;

    var mat4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        create: create,
        clone: clone,
        copy: copy,
        fromValues: fromValues,
        set: set,
        identity: identity,
        transpose: transpose,
        invert: invert,
        adjoint: adjoint,
        determinant: determinant,
        multiply: multiply,
        translate: translate,
        scale: scale,
        rotate: rotate,
        rotateX: rotateX,
        rotateY: rotateY,
        rotateZ: rotateZ,
        fromTranslation: fromTranslation,
        fromScaling: fromScaling,
        fromRotation: fromRotation,
        fromXRotation: fromXRotation,
        fromYRotation: fromYRotation,
        fromZRotation: fromZRotation,
        fromRotationTranslation: fromRotationTranslation,
        fromQuat2: fromQuat2,
        getTranslation: getTranslation,
        getScaling: getScaling,
        getRotation: getRotation,
        fromRotationTranslationScale: fromRotationTranslationScale,
        fromRotationTranslationScaleOrigin: fromRotationTranslationScaleOrigin,
        fromQuat: fromQuat,
        frustum: frustum,
        perspective: perspective,
        perspectiveFromFieldOfView: perspectiveFromFieldOfView,
        ortho: ortho,
        lookAt: lookAt,
        targetTo: targetTo,
        str: str,
        frob: frob,
        add: add,
        subtract: subtract,
        multiplyScalar: multiplyScalar,
        multiplyScalarAndAdd: multiplyScalarAndAdd,
        exactEquals: exactEquals,
        equals: equals,
        mul: mul,
        sub: sub
    });

    /**
     * 3 Dimensional Vector
     * @module vec3
     */

    /**
     * Creates a new, empty vec3
     *
     * @returns {vec3} a new 3D vector
     */

    function create$1() {
      var out = new ARRAY_TYPE(3);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
      }

      return out;
    }
    /**
     * Creates a new vec3 initialized with values from an existing vector
     *
     * @param {ReadonlyVec3} a vector to clone
     * @returns {vec3} a new 3D vector
     */

    function clone$1(a) {
      var out = new ARRAY_TYPE(3);
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      return out;
    }
    /**
     * Calculates the length of a vec3
     *
     * @param {ReadonlyVec3} a vector to calculate length of
     * @returns {Number} length of a
     */

    function length(a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      return Math.hypot(x, y, z);
    }
    /**
     * Creates a new vec3 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} a new 3D vector
     */

    function fromValues$1(x, y, z) {
      var out = new ARRAY_TYPE(3);
      out[0] = x;
      out[1] = y;
      out[2] = z;
      return out;
    }
    /**
     * Copy the values from one vec3 to another
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the source vector
     * @returns {vec3} out
     */

    function copy$1(out, a) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      return out;
    }
    /**
     * Set the components of a vec3 to the given values
     *
     * @param {vec3} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} out
     */

    function set$1(out, x, y, z) {
      out[0] = x;
      out[1] = y;
      out[2] = z;
      return out;
    }
    /**
     * Adds two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function add$1(out, a, b) {
      out[0] = a[0] + b[0];
      out[1] = a[1] + b[1];
      out[2] = a[2] + b[2];
      return out;
    }
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function subtract$1(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      out[2] = a[2] - b[2];
      return out;
    }
    /**
     * Multiplies two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function multiply$1(out, a, b) {
      out[0] = a[0] * b[0];
      out[1] = a[1] * b[1];
      out[2] = a[2] * b[2];
      return out;
    }
    /**
     * Divides two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function divide(out, a, b) {
      out[0] = a[0] / b[0];
      out[1] = a[1] / b[1];
      out[2] = a[2] / b[2];
      return out;
    }
    /**
     * Math.ceil the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to ceil
     * @returns {vec3} out
     */

    function ceil(out, a) {
      out[0] = Math.ceil(a[0]);
      out[1] = Math.ceil(a[1]);
      out[2] = Math.ceil(a[2]);
      return out;
    }
    /**
     * Math.floor the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to floor
     * @returns {vec3} out
     */

    function floor(out, a) {
      out[0] = Math.floor(a[0]);
      out[1] = Math.floor(a[1]);
      out[2] = Math.floor(a[2]);
      return out;
    }
    /**
     * Returns the minimum of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function min(out, a, b) {
      out[0] = Math.min(a[0], b[0]);
      out[1] = Math.min(a[1], b[1]);
      out[2] = Math.min(a[2], b[2]);
      return out;
    }
    /**
     * Returns the maximum of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function max(out, a, b) {
      out[0] = Math.max(a[0], b[0]);
      out[1] = Math.max(a[1], b[1]);
      out[2] = Math.max(a[2], b[2]);
      return out;
    }
    /**
     * Math.round the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to round
     * @returns {vec3} out
     */

    function round(out, a) {
      out[0] = Math.round(a[0]);
      out[1] = Math.round(a[1]);
      out[2] = Math.round(a[2]);
      return out;
    }
    /**
     * Scales a vec3 by a scalar number
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec3} out
     */

    function scale$1(out, a, b) {
      out[0] = a[0] * b;
      out[1] = a[1] * b;
      out[2] = a[2] * b;
      return out;
    }
    /**
     * Adds two vec3's after scaling the second operand by a scalar value
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @param {Number} scale the amount to scale b by before adding
     * @returns {vec3} out
     */

    function scaleAndAdd(out, a, b, scale) {
      out[0] = a[0] + b[0] * scale;
      out[1] = a[1] + b[1] * scale;
      out[2] = a[2] + b[2] * scale;
      return out;
    }
    /**
     * Calculates the euclidian distance between two vec3's
     *
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {Number} distance between a and b
     */

    function distance(a, b) {
      var x = b[0] - a[0];
      var y = b[1] - a[1];
      var z = b[2] - a[2];
      return Math.hypot(x, y, z);
    }
    /**
     * Calculates the squared euclidian distance between two vec3's
     *
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {Number} squared distance between a and b
     */

    function squaredDistance(a, b) {
      var x = b[0] - a[0];
      var y = b[1] - a[1];
      var z = b[2] - a[2];
      return x * x + y * y + z * z;
    }
    /**
     * Calculates the squared length of a vec3
     *
     * @param {ReadonlyVec3} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */

    function squaredLength(a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      return x * x + y * y + z * z;
    }
    /**
     * Negates the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to negate
     * @returns {vec3} out
     */

    function negate(out, a) {
      out[0] = -a[0];
      out[1] = -a[1];
      out[2] = -a[2];
      return out;
    }
    /**
     * Returns the inverse of the components of a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to invert
     * @returns {vec3} out
     */

    function inverse(out, a) {
      out[0] = 1.0 / a[0];
      out[1] = 1.0 / a[1];
      out[2] = 1.0 / a[2];
      return out;
    }
    /**
     * Normalize a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to normalize
     * @returns {vec3} out
     */

    function normalize$1(out, a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var len = x * x + y * y + z * z;

      if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
      }

      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
      return out;
    }
    /**
     * Calculates the dot product of two vec3's
     *
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {Number} dot product of a and b
     */

    function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    /**
     * Computes the cross product of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function cross(out, a, b) {
      var ax = a[0],
          ay = a[1],
          az = a[2];
      var bx = b[0],
          by = b[1],
          bz = b[2];
      out[0] = ay * bz - az * by;
      out[1] = az * bx - ax * bz;
      out[2] = ax * by - ay * bx;
      return out;
    }
    /**
     * Performs a linear interpolation between two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {vec3} out
     */

    function lerp(out, a, b, t) {
      var ax = a[0];
      var ay = a[1];
      var az = a[2];
      out[0] = ax + t * (b[0] - ax);
      out[1] = ay + t * (b[1] - ay);
      out[2] = az + t * (b[2] - az);
      return out;
    }
    /**
     * Performs a hermite interpolation with two control points
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @param {ReadonlyVec3} c the third operand
     * @param {ReadonlyVec3} d the fourth operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {vec3} out
     */

    function hermite(out, a, b, c, d, t) {
      var factorTimes2 = t * t;
      var factor1 = factorTimes2 * (2 * t - 3) + 1;
      var factor2 = factorTimes2 * (t - 2) + t;
      var factor3 = factorTimes2 * (t - 1);
      var factor4 = factorTimes2 * (3 - 2 * t);
      out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
      out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
      out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
      return out;
    }
    /**
     * Performs a bezier interpolation with two control points
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @param {ReadonlyVec3} c the third operand
     * @param {ReadonlyVec3} d the fourth operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {vec3} out
     */

    function bezier(out, a, b, c, d, t) {
      var inverseFactor = 1 - t;
      var inverseFactorTimesTwo = inverseFactor * inverseFactor;
      var factorTimes2 = t * t;
      var factor1 = inverseFactorTimesTwo * inverseFactor;
      var factor2 = 3 * t * inverseFactorTimesTwo;
      var factor3 = 3 * factorTimes2 * inverseFactor;
      var factor4 = factorTimes2 * t;
      out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
      out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
      out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
      return out;
    }
    /**
     * Generates a random vector with the given scale
     *
     * @param {vec3} out the receiving vector
     * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
     * @returns {vec3} out
     */

    function random(out, scale) {
      scale = scale || 1.0;
      var r = RANDOM() * 2.0 * Math.PI;
      var z = RANDOM() * 2.0 - 1.0;
      var zScale = Math.sqrt(1.0 - z * z) * scale;
      out[0] = Math.cos(r) * zScale;
      out[1] = Math.sin(r) * zScale;
      out[2] = z * scale;
      return out;
    }
    /**
     * Transforms the vec3 with a mat4.
     * 4th vector component is implicitly '1'
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the vector to transform
     * @param {ReadonlyMat4} m matrix to transform with
     * @returns {vec3} out
     */

    function transformMat4(out, a, m) {
      var x = a[0],
          y = a[1],
          z = a[2];
      var w = m[3] * x + m[7] * y + m[11] * z + m[15];
      w = w || 1.0;
      out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
      out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
      out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
      return out;
    }
    /**
     * Transforms the vec3 with a mat3.
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the vector to transform
     * @param {ReadonlyMat3} m the 3x3 matrix to transform with
     * @returns {vec3} out
     */

    function transformMat3(out, a, m) {
      var x = a[0],
          y = a[1],
          z = a[2];
      out[0] = x * m[0] + y * m[3] + z * m[6];
      out[1] = x * m[1] + y * m[4] + z * m[7];
      out[2] = x * m[2] + y * m[5] + z * m[8];
      return out;
    }
    /**
     * Transforms the vec3 with a quat
     * Can also be used for dual quaternions. (Multiply it with the real part)
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the vector to transform
     * @param {ReadonlyQuat} q quaternion to transform with
     * @returns {vec3} out
     */

    function transformQuat(out, a, q) {
      // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
      var qx = q[0],
          qy = q[1],
          qz = q[2],
          qw = q[3];
      var x = a[0],
          y = a[1],
          z = a[2]; // var qvec = [qx, qy, qz];
      // var uv = vec3.cross([], qvec, a);

      var uvx = qy * z - qz * y,
          uvy = qz * x - qx * z,
          uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

      var uuvx = qy * uvz - qz * uvy,
          uuvy = qz * uvx - qx * uvz,
          uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

      var w2 = qw * 2;
      uvx *= w2;
      uvy *= w2;
      uvz *= w2; // vec3.scale(uuv, uuv, 2);

      uuvx *= 2;
      uuvy *= 2;
      uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

      out[0] = x + uvx + uuvx;
      out[1] = y + uvy + uuvy;
      out[2] = z + uvz + uuvz;
      return out;
    }
    /**
     * Rotate a 3D vector around the x-axis
     * @param {vec3} out The receiving vec3
     * @param {ReadonlyVec3} a The vec3 point to rotate
     * @param {ReadonlyVec3} b The origin of the rotation
     * @param {Number} rad The angle of rotation in radians
     * @returns {vec3} out
     */

    function rotateX$1(out, a, b, rad) {
      var p = [],
          r = []; //Translate point to the origin

      p[0] = a[0] - b[0];
      p[1] = a[1] - b[1];
      p[2] = a[2] - b[2]; //perform rotation

      r[0] = p[0];
      r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
      r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

      out[0] = r[0] + b[0];
      out[1] = r[1] + b[1];
      out[2] = r[2] + b[2];
      return out;
    }
    /**
     * Rotate a 3D vector around the y-axis
     * @param {vec3} out The receiving vec3
     * @param {ReadonlyVec3} a The vec3 point to rotate
     * @param {ReadonlyVec3} b The origin of the rotation
     * @param {Number} rad The angle of rotation in radians
     * @returns {vec3} out
     */

    function rotateY$1(out, a, b, rad) {
      var p = [],
          r = []; //Translate point to the origin

      p[0] = a[0] - b[0];
      p[1] = a[1] - b[1];
      p[2] = a[2] - b[2]; //perform rotation

      r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
      r[1] = p[1];
      r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

      out[0] = r[0] + b[0];
      out[1] = r[1] + b[1];
      out[2] = r[2] + b[2];
      return out;
    }
    /**
     * Rotate a 3D vector around the z-axis
     * @param {vec3} out The receiving vec3
     * @param {ReadonlyVec3} a The vec3 point to rotate
     * @param {ReadonlyVec3} b The origin of the rotation
     * @param {Number} rad The angle of rotation in radians
     * @returns {vec3} out
     */

    function rotateZ$1(out, a, b, rad) {
      var p = [],
          r = []; //Translate point to the origin

      p[0] = a[0] - b[0];
      p[1] = a[1] - b[1];
      p[2] = a[2] - b[2]; //perform rotation

      r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
      r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
      r[2] = p[2]; //translate to correct position

      out[0] = r[0] + b[0];
      out[1] = r[1] + b[1];
      out[2] = r[2] + b[2];
      return out;
    }
    /**
     * Get the angle between two 3D vectors
     * @param {ReadonlyVec3} a The first operand
     * @param {ReadonlyVec3} b The second operand
     * @returns {Number} The angle in radians
     */

    function angle(a, b) {
      var ax = a[0],
          ay = a[1],
          az = a[2],
          bx = b[0],
          by = b[1],
          bz = b[2],
          mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
          mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
          mag = mag1 * mag2,
          cosine = mag && dot(a, b) / mag;
      return Math.acos(Math.min(Math.max(cosine, -1), 1));
    }
    /**
     * Set the components of a vec3 to zero
     *
     * @param {vec3} out the receiving vector
     * @returns {vec3} out
     */

    function zero(out) {
      out[0] = 0.0;
      out[1] = 0.0;
      out[2] = 0.0;
      return out;
    }
    /**
     * Returns a string representation of a vector
     *
     * @param {ReadonlyVec3} a vector to represent as a string
     * @returns {String} string representation of the vector
     */

    function str$1(a) {
      return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
    }
    /**
     * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
     *
     * @param {ReadonlyVec3} a The first vector.
     * @param {ReadonlyVec3} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */

    function exactEquals$1(a, b) {
      return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {ReadonlyVec3} a The first vector.
     * @param {ReadonlyVec3} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */

    function equals$1(a, b) {
      var a0 = a[0],
          a1 = a[1],
          a2 = a[2];
      var b0 = b[0],
          b1 = b[1],
          b2 = b[2];
      return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
    }
    /**
     * Alias for {@link vec3.subtract}
     * @function
     */

    var sub$1 = subtract$1;
    /**
     * Alias for {@link vec3.multiply}
     * @function
     */

    var mul$1 = multiply$1;
    /**
     * Alias for {@link vec3.divide}
     * @function
     */

    var div = divide;
    /**
     * Alias for {@link vec3.distance}
     * @function
     */

    var dist = distance;
    /**
     * Alias for {@link vec3.squaredDistance}
     * @function
     */

    var sqrDist = squaredDistance;
    /**
     * Alias for {@link vec3.length}
     * @function
     */

    var len = length;
    /**
     * Alias for {@link vec3.squaredLength}
     * @function
     */

    var sqrLen = squaredLength;
    /**
     * Perform some operation over an array of vec3s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    var forEach = function () {
      var vec = create$1();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 3;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          vec[2] = a[i + 2];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
          a[i + 2] = vec[2];
        }

        return a;
      };
    }();

    var vec3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        create: create$1,
        clone: clone$1,
        length: length,
        fromValues: fromValues$1,
        copy: copy$1,
        set: set$1,
        add: add$1,
        subtract: subtract$1,
        multiply: multiply$1,
        divide: divide,
        ceil: ceil,
        floor: floor,
        min: min,
        max: max,
        round: round,
        scale: scale$1,
        scaleAndAdd: scaleAndAdd,
        distance: distance,
        squaredDistance: squaredDistance,
        squaredLength: squaredLength,
        negate: negate,
        inverse: inverse,
        normalize: normalize$1,
        dot: dot,
        cross: cross,
        lerp: lerp,
        hermite: hermite,
        bezier: bezier,
        random: random,
        transformMat4: transformMat4,
        transformMat3: transformMat3,
        transformQuat: transformQuat,
        rotateX: rotateX$1,
        rotateY: rotateY$1,
        rotateZ: rotateZ$1,
        angle: angle,
        zero: zero,
        str: str$1,
        exactEquals: exactEquals$1,
        equals: equals$1,
        sub: sub$1,
        mul: mul$1,
        div: div,
        dist: dist,
        sqrDist: sqrDist,
        len: len,
        sqrLen: sqrLen,
        forEach: forEach
    });

    /* node_modules/@sveltejs/gl/scene/Scene.svelte generated by Svelte v3.24.0 */

    const { Error: Error_1 } = globals;
    const file = "node_modules/@sveltejs/gl/scene/Scene.svelte";

    const get_default_slot_changes = dirty => ({
    	width: dirty[0] & /*$width*/ 8,
    	height: dirty[0] & /*$height*/ 16
    });

    const get_default_slot_context = ctx => ({
    	width: /*$width*/ ctx[3],
    	height: /*$height*/ ctx[4]
    });

    // (425:1) {#if gl}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope, $width, $height*/ 2072) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(425:1) {#if gl}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let canvas_1;
    	let t;
    	let div_resize_listener;
    	let current;
    	let if_block = /*gl*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas_1 = element("canvas");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(canvas_1, "class", "svelte-6pzapg");
    			add_location(canvas_1, file, 422, 1, 10715);
    			attr_dev(div, "class", "container svelte-6pzapg");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[14].call(div));
    			add_location(div, file, 421, 0, 10636);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas_1);
    			/*canvas_1_binding*/ ctx[13](canvas_1);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[14].bind(div));
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*gl*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*gl*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*canvas_1_binding*/ ctx[13](null);
    			if (if_block) if_block.d();
    			div_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function is_intersecting(el) {
    	// TODO this shouldn't be necessary. But the initial value
    	// of entry.isIntersecting in an IO can be incorrect, it
    	// turns out? need to investigate further
    	const bcr = el.getBoundingClientRect();

    	return bcr.bottom > 0 && bcr.right > 0 && bcr.top < window.innerHeight && bcr.left < window.innerWidth;
    }

    function get_visibility(node) {
    	return readable(false, set => {
    		if (typeof IntersectionObserver !== "undefined") {
    			const observer = new IntersectionObserver(entries => {
    					// set(entries[0].isIntersecting);
    					set(is_intersecting(node));
    				});

    			observer.observe(node);
    			return () => observer.unobserve(node);
    		}

    		if (typeof window !== "undefined") {
    			function handler() {
    				const { top, bottom } = node.getBoundingClientRect();
    				set(bottom > 0 && top < window.innerHeight);
    			}

    			window.addEventListener("scroll", handler);
    			window.addEventListener("resize", handler);

    			return () => {
    				window.removeEventListener("scroll", handler);
    				window.removeEventListener("resize", handler);
    			};
    		}
    	});
    }

    const num_lights = 8;

    function instance($$self, $$props, $$invalidate) {
    	let $width;
    	let $height;

    	let $visible,
    		$$unsubscribe_visible = noop,
    		$$subscribe_visible = () => ($$unsubscribe_visible(), $$unsubscribe_visible = subscribe(visible, $$value => $$invalidate(23, $visible = $$value)), visible);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_visible());
    	let { background = [1, 1, 1] } = $$props;
    	let { backgroundOpacity = 1 } = $$props;
    	let { fog = undefined } = $$props;
    	let { pixelRatio = undefined } = $$props;
    	const use_fog = "fog" in $$props;
    	let canvas;
    	let visible = writable(false);
    	validate_store(visible, "visible");
    	$$subscribe_visible();
    	let pending = false;
    	let update_scheduled = false;
    	let w;
    	let h;
    	let gl;

    	let draw = () => {
    		
    	};

    	let camera_stores = {
    		camera_matrix: writable(),
    		view: writable(),
    		projection: writable()
    	};

    	const invalidate = typeof window !== "undefined"
    	? () => {
    			if (!update_scheduled) {
    				update_scheduled = true;
    				requestAnimationFrame(draw);
    			}
    		}
    	: () => {
    			
    		};

    	const width = writable(1);
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(3, $width = value));
    	const height = writable(1);
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(4, $height = value));
    	const root_layer = create_layer(0, invalidate);
    	const default_camera = {}; /* TODO */
    	let camera = default_camera;
    	const meshes = [];

    	// lights
    	const lights = { ambient: [], directional: [], point: [] };

    	function add_to(array) {
    		return fn => {
    			array.push(fn);
    			invalidate();

    			onDestroy(() => {
    				const i = array.indexOf(fn);
    				if (~i) array.splice(i, 1);
    				invalidate();
    			});
    		};
    	}

    	const targets = new Map();
    	let camera_position_changed_since_last_render = true;

    	const scene = {
    		defines: [
    			`#define NUM_LIGHTS 2\n` + // TODO configure this
    			`#define USE_FOG ${use_fog}\n`
    		].join(""),
    		add_camera: _camera => {
    			if (camera && camera !== default_camera) {
    				throw new Error(`A scene can only have one camera`);
    			}

    			camera = _camera;
    			invalidate();

    			// TODO this is garbage
    			camera_stores.camera_matrix.set(camera.matrix);

    			camera_stores.projection.set(camera.projection);
    			camera_stores.view.set(camera.view);

    			onDestroy(() => {
    				camera = default_camera;
    				invalidate();
    			});
    		},
    		update_camera: camera => {
    			// for overlays
    			camera_stores.camera_matrix.set(camera.matrix);

    			camera_stores.view.set(camera.view);
    			camera_stores.projection.set(camera.projection);
    			camera_position_changed_since_last_render = true;
    			invalidate();
    		},
    		add_directional_light: add_to(lights.directional),
    		add_point_light: add_to(lights.point),
    		add_ambient_light: add_to(lights.ambient),
    		get_target(id) {
    			if (!targets.has(id)) targets.set(id, writable(null));
    			return targets.get(id);
    		},
    		invalidate,
    		...camera_stores,
    		width,
    		height
    	};

    	setContext(RENDERER, scene);
    	setContext(LAYER, root_layer);
    	const origin = identity(create());
    	const ctm = writable(origin);

    	setContext(PARENT, {
    		get_matrix_world: () => origin,
    		ctm: { subscribe: ctm.subscribe }
    	});

    	onMount(() => {
    		$$invalidate(20, scene.canvas = canvas, scene);
    		$$invalidate(2, gl = $$invalidate(20, scene.gl = canvas.getContext("webgl"), scene));
    		$$subscribe_visible($$invalidate(1, visible = get_visibility(canvas)));
    		const extensions = ["OES_element_index_uint", "OES_standard_derivatives"];

    		extensions.forEach(name => {
    			const ext = gl.getExtension(name);

    			if (!ext) {
    				throw new Error(`Unsupported extension: ${name}`);
    			}
    		});

    		draw = force => {
    			if (!camera) return; // TODO make this `!ready` or something instead

    			if (dimensions_need_update) {
    				const DPR = pixelRatio || window.devicePixelRatio || 1;
    				$$invalidate(0, canvas.width = $width * DPR, canvas);
    				$$invalidate(0, canvas.height = $height * DPR, canvas);
    				gl.viewport(0, 0, $width * DPR, $height * DPR);
    				dimensions_need_update = false;
    			}

    			update_scheduled = false;

    			if (!$visible && !force) {
    				$$invalidate(15, pending = true);
    				return;
    			}

    			
    			$$invalidate(15, pending = false);
    			gl.clearColor(...bg, backgroundOpacity);
    			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    			gl.enable(gl.CULL_FACE);
    			gl.enable(gl.BLEND);

    			// calculate total ambient light
    			const ambient_light = lights.ambient.reduce(
    				(total, { color, intensity }) => {
    					return [
    						Math.min(total[0] + color[0] * intensity, 1),
    						Math.min(total[1] + color[1] * intensity, 1),
    						Math.min(total[2] + color[2] * intensity, 1)
    					];
    				},
    				new Float32Array([0, 0, 0])
    			);

    			let previous_program;

    			let previous_state = {
    				[gl.DEPTH_TEST]: null,
    				[gl.CULL_FACE]: null
    			};

    			const enable = (key, enabled) => {
    				if (previous_state[key] !== enabled) {
    					if (enabled) gl.enable(key); else gl.disable(key);
    					previous_state[key] = enabled;
    				}
    			};

    			function render_mesh(
    				{ model, model_inverse_transpose, geometry, material, depthTest, doubleSided }
    			) {
    				// TODO should this even be possible?
    				if (!material) return;

    				enable(gl.DEPTH_TEST, depthTest !== false);
    				enable(gl.CULL_FACE, doubleSided !== true);

    				gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE); // source rgb
    				// dest rgb
    				// source alpha
    				// dest alpha

    				if (material.program !== previous_program) {
    					previous_program = material.program;

    					// TODO move logic to the mesh/material?
    					gl.useProgram(material.program);

    					// set built-ins
    					gl.uniform3fv(material.uniform_locations.AMBIENT_LIGHT, ambient_light);

    					if (use_fog) {
    						gl.uniform3fv(material.uniform_locations.FOG_COLOR, bg);
    						gl.uniform1f(material.uniform_locations.FOG_DENSITY, fog);
    					}

    					if (material.uniform_locations.DIRECTIONAL_LIGHTS) {
    						for (let i = 0; i < num_lights; i += 1) {
    							const light = lights.directional[i];
    							if (!light) break;
    							gl.uniform3fv(material.uniform_locations.DIRECTIONAL_LIGHTS[i].direction, light.direction);
    							gl.uniform3fv(material.uniform_locations.DIRECTIONAL_LIGHTS[i].color, light.color);
    							gl.uniform1f(material.uniform_locations.DIRECTIONAL_LIGHTS[i].intensity, light.intensity);
    						}
    					}

    					if (material.uniform_locations.POINT_LIGHTS) {
    						for (let i = 0; i < num_lights; i += 1) {
    							const light = lights.point[i];
    							if (!light) break;
    							gl.uniform3fv(material.uniform_locations.POINT_LIGHTS[i].location, light.location);
    							gl.uniform3fv(material.uniform_locations.POINT_LIGHTS[i].color, light.color);
    							gl.uniform1f(material.uniform_locations.POINT_LIGHTS[i].intensity, light.intensity);
    						}
    					}

    					gl.uniform3fv(material.uniform_locations.CAMERA_WORLD_POSITION, camera.world_position);
    					gl.uniformMatrix4fv(material.uniform_locations.VIEW, false, camera.view);
    					gl.uniformMatrix4fv(material.uniform_locations.PROJECTION, false, camera.projection);
    				}

    				// set mesh-specific built-in uniforms
    				gl.uniformMatrix4fv(material.uniform_locations.MODEL, false, model);

    				gl.uniformMatrix4fv(material.uniform_locations.MODEL_INVERSE_TRANSPOSE, false, model_inverse_transpose);

    				// set material-specific built-in uniforms
    				material.apply_uniforms(gl);

    				// set attributes
    				geometry.set_attributes(gl);

    				// draw
    				if (geometry.index) {
    					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.buffers.__index);
    					gl.drawElements(gl[geometry.primitive], geometry.index.length, gl.UNSIGNED_INT, 0);
    				} else {
    					const primitiveType = gl[geometry.primitive];
    					gl.drawArrays(primitiveType, 0, geometry.count);
    				}
    			}

    			function render_layer(layer) {
    				if (layer.needs_sort) {
    					layer.child_layers.sort((a, b) => a.index - b.index);
    					layer.needs_sort = false;
    				}

    				gl.depthMask(true);
    				gl.clearDepth(1);
    				gl.clear(gl.DEPTH_BUFFER_BIT);

    				for (let i = 0; i < layer.meshes.length; i += 1) {
    					render_mesh(layer.meshes[i]);
    				}

    				// TODO sort transparent meshes, furthest to closest
    				gl.depthMask(false);

    				if (camera_position_changed_since_last_render || layer.needs_transparency_sort) {
    					sort_transparent_meshes(layer.transparent_meshes);
    					layer.needs_transparency_sort = false;
    				}

    				for (let i = 0; i < layer.transparent_meshes.length; i += 1) {
    					render_mesh(layer.transparent_meshes[i]);
    				}

    				for (let i = 0; i < layer.child_layers.length; i += 1) {
    					render_layer(layer.child_layers[i]);
    				}
    			}

    			render_layer(root_layer);
    			camera_position_changed_since_last_render = false;
    		};

    		// for some wacky reason, Adblock Plus seems to prevent the
    		// initial dimensions from being correctly reported
    		const timeout = setTimeout(() => {
    			set_store_value(width, $width = canvas.clientWidth);
    			set_store_value(height, $height = canvas.clientHeight);
    		});

    		tick().then(() => draw(true));

    		return () => {
    			gl.getExtension("WEBGL_lose_context").loseContext();
    			clearTimeout(timeout);
    		};
    	});

    	const sort_transparent_meshes = meshes => {
    		if (meshes.length < 2) return;
    		const lookup = new Map();
    		const out = new Float32Array(16);

    		meshes.forEach(mesh => {
    			const z = multiply(out, camera.view, mesh.model)[14];
    			lookup.set(mesh, z);
    		});

    		meshes.sort((a, b) => lookup.get(a) - lookup.get(b));
    	};

    	let dimensions_need_update = true;

    	const update_dimensions = () => {
    		dimensions_need_update = true;
    		invalidate();
    	};

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Scene", $$slots, ['default']);

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	function div_elementresize_handler() {
    		$width = this.clientWidth;
    		width.set($width);
    		$height = this.clientHeight;
    		height.set($height);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(39, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("background" in $$new_props) $$invalidate(7, background = $$new_props.background);
    		if ("backgroundOpacity" in $$new_props) $$invalidate(8, backgroundOpacity = $$new_props.backgroundOpacity);
    		if ("fog" in $$new_props) $$invalidate(9, fog = $$new_props.fog);
    		if ("pixelRatio" in $$new_props) $$invalidate(10, pixelRatio = $$new_props.pixelRatio);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		is_intersecting,
    		get_visibility,
    		setContext,
    		onMount,
    		onDestroy,
    		tick,
    		writable,
    		RENDERER,
    		LAYER,
    		PARENT,
    		CAMERA,
    		create_layer,
    		create_worker,
    		process_color,
    		mat4,
    		vec3,
    		background,
    		backgroundOpacity,
    		fog,
    		pixelRatio,
    		use_fog,
    		canvas,
    		visible,
    		pending,
    		update_scheduled,
    		w,
    		h,
    		gl,
    		draw,
    		camera_stores,
    		invalidate,
    		width,
    		height,
    		root_layer,
    		default_camera,
    		camera,
    		num_lights,
    		meshes,
    		lights,
    		add_to,
    		targets,
    		camera_position_changed_since_last_render,
    		scene,
    		origin,
    		ctm,
    		sort_transparent_meshes,
    		dimensions_need_update,
    		update_dimensions,
    		bg,
    		$width,
    		$height,
    		$visible
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(39, $$props = assign(assign({}, $$props), $$new_props));
    		if ("background" in $$props) $$invalidate(7, background = $$new_props.background);
    		if ("backgroundOpacity" in $$props) $$invalidate(8, backgroundOpacity = $$new_props.backgroundOpacity);
    		if ("fog" in $$props) $$invalidate(9, fog = $$new_props.fog);
    		if ("pixelRatio" in $$props) $$invalidate(10, pixelRatio = $$new_props.pixelRatio);
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$new_props.canvas);
    		if ("visible" in $$props) $$subscribe_visible($$invalidate(1, visible = $$new_props.visible));
    		if ("pending" in $$props) $$invalidate(15, pending = $$new_props.pending);
    		if ("update_scheduled" in $$props) update_scheduled = $$new_props.update_scheduled;
    		if ("w" in $$props) w = $$new_props.w;
    		if ("h" in $$props) h = $$new_props.h;
    		if ("gl" in $$props) $$invalidate(2, gl = $$new_props.gl);
    		if ("draw" in $$props) draw = $$new_props.draw;
    		if ("camera_stores" in $$props) camera_stores = $$new_props.camera_stores;
    		if ("camera" in $$props) camera = $$new_props.camera;
    		if ("camera_position_changed_since_last_render" in $$props) camera_position_changed_since_last_render = $$new_props.camera_position_changed_since_last_render;
    		if ("dimensions_need_update" in $$props) dimensions_need_update = $$new_props.dimensions_need_update;
    		if ("bg" in $$props) bg = $$new_props.bg;
    	};

    	let bg;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*background*/ 128) {
    			 bg = process_color(background);
    		}

    		if ($$self.$$.dirty[0] & /*$width, $height*/ 24) {
    			 (update_dimensions());
    		}

    		if ($$self.$$.dirty[0] & /*background, backgroundOpacity, fog, scene*/ 1049472) {
    			 (scene.invalidate());
    		}

    		if ($$self.$$.dirty[0] & /*$visible, pending, scene*/ 9469952) {
    			 if ($visible && pending) scene.invalidate();
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		canvas,
    		visible,
    		gl,
    		$width,
    		$height,
    		width,
    		height,
    		background,
    		backgroundOpacity,
    		fog,
    		pixelRatio,
    		$$scope,
    		$$slots,
    		canvas_1_binding,
    		div_elementresize_handler
    	];
    }

    class Scene extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				background: 7,
    				backgroundOpacity: 8,
    				fog: 9,
    				pixelRatio: 10
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scene",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get background() {
    		throw new Error_1("<Scene>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error_1("<Scene>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backgroundOpacity() {
    		throw new Error_1("<Scene>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backgroundOpacity(value) {
    		throw new Error_1("<Scene>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fog() {
    		throw new Error_1("<Scene>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fog(value) {
    		throw new Error_1("<Scene>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pixelRatio() {
    		throw new Error_1("<Scene>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pixelRatio(value) {
    		throw new Error_1("<Scene>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * 3x3 Matrix
     * @module mat3
     */

    /**
     * Creates a new identity mat3
     *
     * @returns {mat3} a new 3x3 matrix
     */

    function create$2() {
      var out = new ARRAY_TYPE(9);

      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
      }

      out[0] = 1;
      out[4] = 1;
      out[8] = 1;
      return out;
    }

    /**
     * 4 Dimensional Vector
     * @module vec4
     */

    /**
     * Creates a new, empty vec4
     *
     * @returns {vec4} a new 4D vector
     */

    function create$3() {
      var out = new ARRAY_TYPE(4);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
      }

      return out;
    }
    /**
     * Creates a new vec4 initialized with values from an existing vector
     *
     * @param {ReadonlyVec4} a vector to clone
     * @returns {vec4} a new 4D vector
     */

    function clone$2(a) {
      var out = new ARRAY_TYPE(4);
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      return out;
    }
    /**
     * Creates a new vec4 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {vec4} a new 4D vector
     */

    function fromValues$2(x, y, z, w) {
      var out = new ARRAY_TYPE(4);
      out[0] = x;
      out[1] = y;
      out[2] = z;
      out[3] = w;
      return out;
    }
    /**
     * Copy the values from one vec4 to another
     *
     * @param {vec4} out the receiving vector
     * @param {ReadonlyVec4} a the source vector
     * @returns {vec4} out
     */

    function copy$2(out, a) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      return out;
    }
    /**
     * Set the components of a vec4 to the given values
     *
     * @param {vec4} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {vec4} out
     */

    function set$2(out, x, y, z, w) {
      out[0] = x;
      out[1] = y;
      out[2] = z;
      out[3] = w;
      return out;
    }
    /**
     * Adds two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {ReadonlyVec4} a the first operand
     * @param {ReadonlyVec4} b the second operand
     * @returns {vec4} out
     */

    function add$2(out, a, b) {
      out[0] = a[0] + b[0];
      out[1] = a[1] + b[1];
      out[2] = a[2] + b[2];
      out[3] = a[3] + b[3];
      return out;
    }
    /**
     * Scales a vec4 by a scalar number
     *
     * @param {vec4} out the receiving vector
     * @param {ReadonlyVec4} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec4} out
     */

    function scale$2(out, a, b) {
      out[0] = a[0] * b;
      out[1] = a[1] * b;
      out[2] = a[2] * b;
      out[3] = a[3] * b;
      return out;
    }
    /**
     * Calculates the length of a vec4
     *
     * @param {ReadonlyVec4} a vector to calculate length of
     * @returns {Number} length of a
     */

    function length$1(a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var w = a[3];
      return Math.hypot(x, y, z, w);
    }
    /**
     * Calculates the squared length of a vec4
     *
     * @param {ReadonlyVec4} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */

    function squaredLength$1(a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var w = a[3];
      return x * x + y * y + z * z + w * w;
    }
    /**
     * Normalize a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {ReadonlyVec4} a vector to normalize
     * @returns {vec4} out
     */

    function normalize$2(out, a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var w = a[3];
      var len = x * x + y * y + z * z + w * w;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
      }

      out[0] = x * len;
      out[1] = y * len;
      out[2] = z * len;
      out[3] = w * len;
      return out;
    }
    /**
     * Calculates the dot product of two vec4's
     *
     * @param {ReadonlyVec4} a the first operand
     * @param {ReadonlyVec4} b the second operand
     * @returns {Number} dot product of a and b
     */

    function dot$1(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    }
    /**
     * Performs a linear interpolation between two vec4's
     *
     * @param {vec4} out the receiving vector
     * @param {ReadonlyVec4} a the first operand
     * @param {ReadonlyVec4} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {vec4} out
     */

    function lerp$1(out, a, b, t) {
      var ax = a[0];
      var ay = a[1];
      var az = a[2];
      var aw = a[3];
      out[0] = ax + t * (b[0] - ax);
      out[1] = ay + t * (b[1] - ay);
      out[2] = az + t * (b[2] - az);
      out[3] = aw + t * (b[3] - aw);
      return out;
    }
    /**
     * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
     *
     * @param {ReadonlyVec4} a The first vector.
     * @param {ReadonlyVec4} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */

    function exactEquals$2(a, b) {
      return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
    }
    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {ReadonlyVec4} a The first vector.
     * @param {ReadonlyVec4} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */

    function equals$2(a, b) {
      var a0 = a[0],
          a1 = a[1],
          a2 = a[2],
          a3 = a[3];
      var b0 = b[0],
          b1 = b[1],
          b2 = b[2],
          b3 = b[3];
      return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
    }
    /**
     * Perform some operation over an array of vec4s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    var forEach$1 = function () {
      var vec = create$3();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 4;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          vec[2] = a[i + 2];
          vec[3] = a[i + 3];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
          a[i + 2] = vec[2];
          a[i + 3] = vec[3];
        }

        return a;
      };
    }();

    /**
     * Quaternion
     * @module quat
     */

    /**
     * Creates a new identity quat
     *
     * @returns {quat} a new quaternion
     */

    function create$4() {
      var out = new ARRAY_TYPE(4);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
      }

      out[3] = 1;
      return out;
    }
    /**
     * Set a quat to the identity quaternion
     *
     * @param {quat} out the receiving quaternion
     * @returns {quat} out
     */

    function identity$1(out) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    }
    /**
     * Sets a quat from the given angle and rotation axis,
     * then returns it.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyVec3} axis the axis around which to rotate
     * @param {Number} rad the angle in radians
     * @returns {quat} out
     **/

    function setAxisAngle(out, axis, rad) {
      rad = rad * 0.5;
      var s = Math.sin(rad);
      out[0] = s * axis[0];
      out[1] = s * axis[1];
      out[2] = s * axis[2];
      out[3] = Math.cos(rad);
      return out;
    }
    /**
     * Gets the rotation axis and angle for a given
     *  quaternion. If a quaternion is created with
     *  setAxisAngle, this method will return the same
     *  values as providied in the original parameter list
     *  OR functionally equivalent values.
     * Example: The quaternion formed by axis [0, 0, 1] and
     *  angle -90 is the same as the quaternion formed by
     *  [0, 0, 1] and 270. This method favors the latter.
     * @param  {vec3} out_axis  Vector receiving the axis of rotation
     * @param  {ReadonlyQuat} q     Quaternion to be decomposed
     * @return {Number}     Angle, in radians, of the rotation
     */

    function getAxisAngle(out_axis, q) {
      var rad = Math.acos(q[3]) * 2.0;
      var s = Math.sin(rad / 2.0);

      if (s > EPSILON) {
        out_axis[0] = q[0] / s;
        out_axis[1] = q[1] / s;
        out_axis[2] = q[2] / s;
      } else {
        // If s is zero, return any axis (no rotation - axis does not matter)
        out_axis[0] = 1;
        out_axis[1] = 0;
        out_axis[2] = 0;
      }

      return rad;
    }
    /**
     * Gets the angular distance between two unit quaternions
     *
     * @param  {ReadonlyQuat} a     Origin unit quaternion
     * @param  {ReadonlyQuat} b     Destination unit quaternion
     * @return {Number}     Angle, in radians, between the two quaternions
     */

    function getAngle(a, b) {
      var dotproduct = dot$2(a, b);
      return Math.acos(2 * dotproduct * dotproduct - 1);
    }
    /**
     * Multiplies two quat's
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @returns {quat} out
     */

    function multiply$2(out, a, b) {
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var bx = b[0],
          by = b[1],
          bz = b[2],
          bw = b[3];
      out[0] = ax * bw + aw * bx + ay * bz - az * by;
      out[1] = ay * bw + aw * by + az * bx - ax * bz;
      out[2] = az * bw + aw * bz + ax * by - ay * bx;
      out[3] = aw * bw - ax * bx - ay * by - az * bz;
      return out;
    }
    /**
     * Rotates a quaternion by the given angle about the X axis
     *
     * @param {quat} out quat receiving operation result
     * @param {ReadonlyQuat} a quat to rotate
     * @param {number} rad angle (in radians) to rotate
     * @returns {quat} out
     */

    function rotateX$2(out, a, rad) {
      rad *= 0.5;
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var bx = Math.sin(rad),
          bw = Math.cos(rad);
      out[0] = ax * bw + aw * bx;
      out[1] = ay * bw + az * bx;
      out[2] = az * bw - ay * bx;
      out[3] = aw * bw - ax * bx;
      return out;
    }
    /**
     * Rotates a quaternion by the given angle about the Y axis
     *
     * @param {quat} out quat receiving operation result
     * @param {ReadonlyQuat} a quat to rotate
     * @param {number} rad angle (in radians) to rotate
     * @returns {quat} out
     */

    function rotateY$2(out, a, rad) {
      rad *= 0.5;
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var by = Math.sin(rad),
          bw = Math.cos(rad);
      out[0] = ax * bw - az * by;
      out[1] = ay * bw + aw * by;
      out[2] = az * bw + ax * by;
      out[3] = aw * bw - ay * by;
      return out;
    }
    /**
     * Rotates a quaternion by the given angle about the Z axis
     *
     * @param {quat} out quat receiving operation result
     * @param {ReadonlyQuat} a quat to rotate
     * @param {number} rad angle (in radians) to rotate
     * @returns {quat} out
     */

    function rotateZ$2(out, a, rad) {
      rad *= 0.5;
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var bz = Math.sin(rad),
          bw = Math.cos(rad);
      out[0] = ax * bw + ay * bz;
      out[1] = ay * bw - ax * bz;
      out[2] = az * bw + aw * bz;
      out[3] = aw * bw - az * bz;
      return out;
    }
    /**
     * Calculates the W component of a quat from the X, Y, and Z components.
     * Assumes that quaternion is 1 unit in length.
     * Any existing W component will be ignored.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quat to calculate W component of
     * @returns {quat} out
     */

    function calculateW(out, a) {
      var x = a[0],
          y = a[1],
          z = a[2];
      out[0] = x;
      out[1] = y;
      out[2] = z;
      out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
      return out;
    }
    /**
     * Calculate the exponential of a unit quaternion.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quat to calculate the exponential of
     * @returns {quat} out
     */

    function exp(out, a) {
      var x = a[0],
          y = a[1],
          z = a[2],
          w = a[3];
      var r = Math.sqrt(x * x + y * y + z * z);
      var et = Math.exp(w);
      var s = r > 0 ? et * Math.sin(r) / r : 0;
      out[0] = x * s;
      out[1] = y * s;
      out[2] = z * s;
      out[3] = et * Math.cos(r);
      return out;
    }
    /**
     * Calculate the natural logarithm of a unit quaternion.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quat to calculate the exponential of
     * @returns {quat} out
     */

    function ln(out, a) {
      var x = a[0],
          y = a[1],
          z = a[2],
          w = a[3];
      var r = Math.sqrt(x * x + y * y + z * z);
      var t = r > 0 ? Math.atan2(r, w) / r : 0;
      out[0] = x * t;
      out[1] = y * t;
      out[2] = z * t;
      out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
      return out;
    }
    /**
     * Calculate the scalar power of a unit quaternion.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quat to calculate the exponential of
     * @param {Number} b amount to scale the quaternion by
     * @returns {quat} out
     */

    function pow(out, a, b) {
      ln(out, a);
      scale$3(out, out, b);
      exp(out, out);
      return out;
    }
    /**
     * Performs a spherical linear interpolation between two quat
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {quat} out
     */

    function slerp(out, a, b, t) {
      // benchmarks:
      //    http://jsperf.com/quaternion-slerp-implementations
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var bx = b[0],
          by = b[1],
          bz = b[2],
          bw = b[3];
      var omega, cosom, sinom, scale0, scale1; // calc cosine

      cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

      if (cosom < 0.0) {
        cosom = -cosom;
        bx = -bx;
        by = -by;
        bz = -bz;
        bw = -bw;
      } // calculate coefficients


      if (1.0 - cosom > EPSILON) {
        // standard case (slerp)
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
      } else {
        // "from" and "to" quaternions are very close
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
      } // calculate final values


      out[0] = scale0 * ax + scale1 * bx;
      out[1] = scale0 * ay + scale1 * by;
      out[2] = scale0 * az + scale1 * bz;
      out[3] = scale0 * aw + scale1 * bw;
      return out;
    }
    /**
     * Generates a random unit quaternion
     *
     * @param {quat} out the receiving quaternion
     * @returns {quat} out
     */

    function random$1(out) {
      // Implementation of http://planning.cs.uiuc.edu/node198.html
      // TODO: Calling random 3 times is probably not the fastest solution
      var u1 = RANDOM();
      var u2 = RANDOM();
      var u3 = RANDOM();
      var sqrt1MinusU1 = Math.sqrt(1 - u1);
      var sqrtU1 = Math.sqrt(u1);
      out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
      out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
      out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
      out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
      return out;
    }
    /**
     * Calculates the inverse of a quat
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quat to calculate inverse of
     * @returns {quat} out
     */

    function invert$1(out, a) {
      var a0 = a[0],
          a1 = a[1],
          a2 = a[2],
          a3 = a[3];
      var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
      var invDot = dot ? 1.0 / dot : 0; // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

      out[0] = -a0 * invDot;
      out[1] = -a1 * invDot;
      out[2] = -a2 * invDot;
      out[3] = a3 * invDot;
      return out;
    }
    /**
     * Calculates the conjugate of a quat
     * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quat to calculate conjugate of
     * @returns {quat} out
     */

    function conjugate(out, a) {
      out[0] = -a[0];
      out[1] = -a[1];
      out[2] = -a[2];
      out[3] = a[3];
      return out;
    }
    /**
     * Creates a quaternion from the given 3x3 rotation matrix.
     *
     * NOTE: The resultant quaternion is not normalized, so you should be sure
     * to renormalize the quaternion yourself where necessary.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyMat3} m rotation matrix
     * @returns {quat} out
     * @function
     */

    function fromMat3(out, m) {
      // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
      // article "Quaternion Calculus and Fast Animation".
      var fTrace = m[0] + m[4] + m[8];
      var fRoot;

      if (fTrace > 0.0) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0); // 2w

        out[3] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot; // 1/(4w)

        out[0] = (m[5] - m[7]) * fRoot;
        out[1] = (m[6] - m[2]) * fRoot;
        out[2] = (m[1] - m[3]) * fRoot;
      } else {
        // |w| <= 1/2
        var i = 0;
        if (m[4] > m[0]) i = 1;
        if (m[8] > m[i * 3 + i]) i = 2;
        var j = (i + 1) % 3;
        var k = (i + 2) % 3;
        fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
        out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
        out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
      }

      return out;
    }
    /**
     * Creates a quaternion from the given euler angle x, y, z.
     *
     * @param {quat} out the receiving quaternion
     * @param {x} Angle to rotate around X axis in degrees.
     * @param {y} Angle to rotate around Y axis in degrees.
     * @param {z} Angle to rotate around Z axis in degrees.
     * @returns {quat} out
     * @function
     */

    function fromEuler(out, x, y, z) {
      var halfToRad = 0.5 * Math.PI / 180.0;
      x *= halfToRad;
      y *= halfToRad;
      z *= halfToRad;
      var sx = Math.sin(x);
      var cx = Math.cos(x);
      var sy = Math.sin(y);
      var cy = Math.cos(y);
      var sz = Math.sin(z);
      var cz = Math.cos(z);
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
      return out;
    }
    /**
     * Returns a string representation of a quatenion
     *
     * @param {ReadonlyQuat} a vector to represent as a string
     * @returns {String} string representation of the vector
     */

    function str$2(a) {
      return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
    }
    /**
     * Creates a new quat initialized with values from an existing quaternion
     *
     * @param {ReadonlyQuat} a quaternion to clone
     * @returns {quat} a new quaternion
     * @function
     */

    var clone$3 = clone$2;
    /**
     * Creates a new quat initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {quat} a new quaternion
     * @function
     */

    var fromValues$3 = fromValues$2;
    /**
     * Copy the values from one quat to another
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the source quaternion
     * @returns {quat} out
     * @function
     */

    var copy$3 = copy$2;
    /**
     * Set the components of a quat to the given values
     *
     * @param {quat} out the receiving quaternion
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @param {Number} w W component
     * @returns {quat} out
     * @function
     */

    var set$3 = set$2;
    /**
     * Adds two quat's
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @returns {quat} out
     * @function
     */

    var add$3 = add$2;
    /**
     * Alias for {@link quat.multiply}
     * @function
     */

    var mul$2 = multiply$2;
    /**
     * Scales a quat by a scalar number
     *
     * @param {quat} out the receiving vector
     * @param {ReadonlyQuat} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {quat} out
     * @function
     */

    var scale$3 = scale$2;
    /**
     * Calculates the dot product of two quat's
     *
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @returns {Number} dot product of a and b
     * @function
     */

    var dot$2 = dot$1;
    /**
     * Performs a linear interpolation between two quat's
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {quat} out
     * @function
     */

    var lerp$2 = lerp$1;
    /**
     * Calculates the length of a quat
     *
     * @param {ReadonlyQuat} a vector to calculate length of
     * @returns {Number} length of a
     */

    var length$2 = length$1;
    /**
     * Alias for {@link quat.length}
     * @function
     */

    var len$1 = length$2;
    /**
     * Calculates the squared length of a quat
     *
     * @param {ReadonlyQuat} a vector to calculate squared length of
     * @returns {Number} squared length of a
     * @function
     */

    var squaredLength$2 = squaredLength$1;
    /**
     * Alias for {@link quat.squaredLength}
     * @function
     */

    var sqrLen$1 = squaredLength$2;
    /**
     * Normalize a quat
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quaternion to normalize
     * @returns {quat} out
     * @function
     */

    var normalize$3 = normalize$2;
    /**
     * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
     *
     * @param {ReadonlyQuat} a The first quaternion.
     * @param {ReadonlyQuat} b The second quaternion.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */

    var exactEquals$3 = exactEquals$2;
    /**
     * Returns whether or not the quaternions have approximately the same elements in the same position.
     *
     * @param {ReadonlyQuat} a The first vector.
     * @param {ReadonlyQuat} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */

    var equals$3 = equals$2;
    /**
     * Sets a quaternion to represent the shortest rotation from one
     * vector to another.
     *
     * Both vectors are assumed to be unit length.
     *
     * @param {quat} out the receiving quaternion.
     * @param {ReadonlyVec3} a the initial vector
     * @param {ReadonlyVec3} b the destination vector
     * @returns {quat} out
     */

    var rotationTo = function () {
      var tmpvec3 = create$1();
      var xUnitVec3 = fromValues$1(1, 0, 0);
      var yUnitVec3 = fromValues$1(0, 1, 0);
      return function (out, a, b) {
        var dot$1 = dot(a, b);

        if (dot$1 < -0.999999) {
          cross(tmpvec3, xUnitVec3, a);
          if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
          normalize$1(tmpvec3, tmpvec3);
          setAxisAngle(out, tmpvec3, Math.PI);
          return out;
        } else if (dot$1 > 0.999999) {
          out[0] = 0;
          out[1] = 0;
          out[2] = 0;
          out[3] = 1;
          return out;
        } else {
          cross(tmpvec3, a, b);
          out[0] = tmpvec3[0];
          out[1] = tmpvec3[1];
          out[2] = tmpvec3[2];
          out[3] = 1 + dot$1;
          return normalize$3(out, out);
        }
      };
    }();
    /**
     * Performs a spherical linear interpolation with two control points
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @param {ReadonlyQuat} c the third operand
     * @param {ReadonlyQuat} d the fourth operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {quat} out
     */

    var sqlerp = function () {
      var temp1 = create$4();
      var temp2 = create$4();
      return function (out, a, b, c, d, t) {
        slerp(temp1, a, d, t);
        slerp(temp2, b, c, t);
        slerp(out, temp1, temp2, 2 * t * (1 - t));
        return out;
      };
    }();
    /**
     * Sets the specified quaternion with values corresponding to the given
     * axes. Each axis is a vec3 and is expected to be unit length and
     * perpendicular to all other specified axes.
     *
     * @param {ReadonlyVec3} view  the vector representing the viewing direction
     * @param {ReadonlyVec3} right the vector representing the local "right" direction
     * @param {ReadonlyVec3} up    the vector representing the local "up" direction
     * @returns {quat} out
     */

    var setAxes = function () {
      var matr = create$2();
      return function (out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];
        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];
        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];
        return normalize$3(out, fromMat3(out, matr));
      };
    }();

    var quat = /*#__PURE__*/Object.freeze({
        __proto__: null,
        create: create$4,
        identity: identity$1,
        setAxisAngle: setAxisAngle,
        getAxisAngle: getAxisAngle,
        getAngle: getAngle,
        multiply: multiply$2,
        rotateX: rotateX$2,
        rotateY: rotateY$2,
        rotateZ: rotateZ$2,
        calculateW: calculateW,
        exp: exp,
        ln: ln,
        pow: pow,
        slerp: slerp,
        random: random$1,
        invert: invert$1,
        conjugate: conjugate,
        fromMat3: fromMat3,
        fromEuler: fromEuler,
        str: str$2,
        clone: clone$3,
        fromValues: fromValues$3,
        copy: copy$3,
        set: set$3,
        add: add$3,
        mul: mul$2,
        scale: scale$3,
        dot: dot$2,
        lerp: lerp$2,
        length: length$2,
        len: len$1,
        squaredLength: squaredLength$2,
        sqrLen: sqrLen$1,
        normalize: normalize$3,
        exactEquals: exactEquals$3,
        equals: equals$3,
        rotationTo: rotationTo,
        sqlerp: sqlerp,
        setAxes: setAxes
    });

    /* node_modules/@sveltejs/gl/scene/Group.svelte generated by Svelte v3.24.0 */

    function create_fragment$1(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $target,
    		$$unsubscribe_target = noop,
    		$$subscribe_target = () => ($$unsubscribe_target(), $$unsubscribe_target = subscribe(target, $$value => $$invalidate(13, $target = $$value)), target);

    	let $parent_ctm;
    	let $ctm;
    	$$self.$$.on_destroy.push(() => $$unsubscribe_target());
    	let { location = [0, 0, 0] } = $$props;
    	let { lookAt = undefined } = $$props;
    	let { up = [0, 1, 0] } = $$props;
    	let { rotation = [0, 0, 0] } = $$props; // TODO make it possible to set a quaternion as a prop?
    	let { scale: scale$1 = 1 } = $$props;
    	const scene = get_scene();
    	const parent = get_parent();
    	const { ctm: parent_ctm } = parent;
    	validate_store(parent_ctm, "parent_ctm");
    	component_subscribe($$self, parent_ctm, value => $$invalidate(14, $parent_ctm = value));
    	const ctm = writable(null);
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(15, $ctm = value));
    	let matrix = create();
    	let quaternion = create$4();
    	const world_position = new Float32Array(matrix.buffer, 12 * 4, 3);
    	set_parent({ ctm });
    	const writable_props = ["location", "lookAt", "up", "rotation", "scale"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Group> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Group", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(3, location = $$props.location);
    		if ("lookAt" in $$props) $$invalidate(4, lookAt = $$props.lookAt);
    		if ("up" in $$props) $$invalidate(5, up = $$props.up);
    		if ("rotation" in $$props) $$invalidate(6, rotation = $$props.rotation);
    		if ("scale" in $$props) $$invalidate(7, scale$1 = $$props.scale);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		get_scene,
    		get_parent,
    		set_parent,
    		mat4,
    		quat,
    		location,
    		lookAt,
    		up,
    		rotation,
    		scale: scale$1,
    		scene,
    		parent,
    		parent_ctm,
    		ctm,
    		matrix,
    		quaternion,
    		world_position,
    		scale_array,
    		target,
    		$target,
    		$parent_ctm,
    		$ctm
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(3, location = $$props.location);
    		if ("lookAt" in $$props) $$invalidate(4, lookAt = $$props.lookAt);
    		if ("up" in $$props) $$invalidate(5, up = $$props.up);
    		if ("rotation" in $$props) $$invalidate(6, rotation = $$props.rotation);
    		if ("scale" in $$props) $$invalidate(7, scale$1 = $$props.scale);
    		if ("matrix" in $$props) $$invalidate(10, matrix = $$props.matrix);
    		if ("quaternion" in $$props) $$invalidate(11, quaternion = $$props.quaternion);
    		if ("scale_array" in $$props) $$invalidate(12, scale_array = $$props.scale_array);
    		if ("target" in $$props) $$subscribe_target($$invalidate(0, target = $$props.target));
    	};

    	let scale_array;
    	let target;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scale*/ 128) {
    			 $$invalidate(12, scale_array = typeof scale$1 === "number"
    			? [scale$1, scale$1, scale$1]
    			: scale$1);
    		}

    		if ($$self.$$.dirty & /*lookAt*/ 16) {
    			 $$subscribe_target($$invalidate(0, target = lookAt ? scene.get_target(lookAt) : writable(null)));
    		}

    		if ($$self.$$.dirty & /*$target, matrix, $parent_ctm, location, up, scale_array, quaternion, rotation, $ctm*/ 64616) {
    			 if ($target) {
    				translate(matrix, $parent_ctm, location);
    				targetTo(matrix, world_position, $target, up);
    				scale(matrix, matrix, scale_array);
    				set_store_value(ctm, $ctm = matrix);
    			} else {
    				$$invalidate(11, quaternion = fromEuler(quaternion || create$4(), ...rotation));
    				$$invalidate(10, matrix = fromRotationTranslationScale(matrix, quaternion, location, scale_array));
    				set_store_value(ctm, $ctm = multiply($ctm || create(), $parent_ctm, matrix));
    			}
    		}

    		if ($$self.$$.dirty & /*$ctm*/ 32768) {
    			// $: quaternion = quat.fromEuler(quaternion || quat.create(), ...rotation);
    			// $: matrix = mat4.fromRotationTranslationScale(matrix || mat4.create(), quaternion, location, scale_array);
    			// $: $ctm = mat4.multiply($ctm || mat4.create(), $parent_ctm, matrix);
    			 (scene.invalidate());
    		}
    	};

    	return [
    		target,
    		parent_ctm,
    		ctm,
    		location,
    		lookAt,
    		up,
    		rotation,
    		scale$1,
    		$$scope,
    		$$slots
    	];
    }

    class Group extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			location: 3,
    			lookAt: 4,
    			up: 5,
    			rotation: 6,
    			scale: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Group",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get location() {
    		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lookAt() {
    		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lookAt(value) {
    		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get up() {
    		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set up(value) {
    		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotation() {
    		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotation(value) {
    		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/Layer.svelte generated by Svelte v3.24.0 */
    const file$1 = "node_modules/@sveltejs/gl/scene/Layer.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "layer svelte-qsggnw");
    			add_location(div, file$1, 8, 0, 158);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { index = undefined } = $$props;
    	set_layer(get_layer().add_child(index));
    	const writable_props = ["index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Layer", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ get_layer, set_layer, index });

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [index, $$scope, $$slots];
    }

    class Layer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { index: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layer",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get index() {
    		throw new Error("<Layer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Layer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var vert_builtin = "precision highp float;uniform mat4 MODEL;uniform mat4 PROJECTION;uniform mat4 VIEW;uniform mat4 MODEL_INVERSE_TRANSPOSE;uniform vec3 CAMERA_WORLD_POSITION;struct PointLight{vec3 location;vec3 color;float intensity;};uniform PointLight POINT_LIGHTS[NUM_LIGHTS];";

    var frag_builtin = "#extension GL_OES_standard_derivatives : enable\nprecision highp float;struct DirectionalLight{vec3 direction;vec3 color;float intensity;};struct PointLight{vec3 location;vec3 color;float intensity;};uniform vec3 AMBIENT_LIGHT;uniform DirectionalLight DIRECTIONAL_LIGHTS[NUM_LIGHTS];uniform PointLight POINT_LIGHTS[NUM_LIGHTS];";

    const caches = new Map();

    const setters = {
    	[5126]:  (gl, loc, data) => gl.uniform1f(loc, data),
    	[35664]: (gl, loc, data) => gl.uniform2fv(loc, data),
    	[35665]: (gl, loc, data) => gl.uniform3fv(loc, data),
    	[35666]: (gl, loc, data) => gl.uniform4fv(loc, data),

    	[35674]: (gl, loc, data) => gl.uniformMatrix2fv(loc, false, data),
    	[35675]: (gl, loc, data) => gl.uniformMatrix3fv(loc, false, data),
    	[35676]: (gl, loc, data) => gl.uniformMatrix4fv(loc, false, data),

    	[35678]: (gl, loc, data) => {
    		gl.activeTexture(gl[`TEXTURE${data.index}`]);
    		gl.bindTexture(gl.TEXTURE_2D, data.texture);
    		gl.uniform1i(loc, data.index);
    	}
    };

    function compile(gl, vert, frag) {
    	if (!caches.has(gl)) caches.set(gl, new Map());
    	const cache = caches.get(gl);

    	const hash = vert + frag;
    	if (!cache.has(hash)) {
    		const program = create_program(gl, vert, frag);
    		const uniforms = get_uniforms(gl, program);
    		const attributes = get_attributes(gl, program);

    		cache.set(hash, { program, uniforms, attributes });
    	}

    	return cache.get(hash);
    }

    function pad(num, len = 4) {
    	num = String(num);
    	while (num.length < len) num = ` ${num}`;
    	return num;
    }

    function repeat(str, i) {
    	let result = '';
    	while (i--) result += str;
    	return result;
    }

    function create_shader(gl, type, source, label) {
    	const shader = gl.createShader(type);
    	gl.shaderSource(shader, source);
    	gl.compileShader(shader);

    	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    		return shader;
    	}

    	const log = gl.getShaderInfoLog(shader);
    	const match = /ERROR: (\d+):(\d+): (.+)/.exec(log);

    	if (match) {
    		const c = +match[1];
    		const l = +match[2] - 1;

    		console.log('%c' + match[3], 'font-weight: bold; color: red');

    		const lines = source.split('\n');
    		for (let i = 0; i < lines.length; i += 1) {
    			if (Math.abs(l - i) > 5) continue;

    			const line = lines[i].replace(/^\t+/gm, tabs => repeat(' ', tabs.length * 4));
    			const indent = /^\s+/.exec(line);

    			const str = `${pad(i)}: ${line}`;

    			if (i === l) {
    				console.log('%c' + str, 'font-weight: bold; color: red');
    				console.log('%c' + (indent && indent[0] || '') + repeat(' ', c + 6) + '^', 'color: red');
    			} else {
    				console.log(str);
    			}
    		}

    		throw new Error(`Failed to compile ${label} shader`);
    	}

    	throw new Error(`Failed to compile ${label} shader:\n${log}`);
    }

    function create_program(gl, vert, frag) {
    	const program = gl.createProgram();

    	gl.attachShader(program, create_shader(gl, gl.VERTEX_SHADER, vert, 'vertex'));
    	gl.attachShader(program, create_shader(gl, gl.FRAGMENT_SHADER, frag, 'fragment'));
    	gl.linkProgram(program);

    	const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    	if (!success) {
    		console.log(gl.getProgramInfoLog(program));
    		throw new Error(`Failed to compile program:\n${gl.getProgramInfoLog(program)}`);
    	}

    	return program;
    }

    function get_uniforms(gl, program) {
    	const uniforms = [];

    	const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    	for (let i = 0; i < n; i += 1) {
    		let { size, type, name } = gl.getActiveUniform(program, i);
    		const loc = gl.getUniformLocation(program, name);
    		const setter = setters[type];

    		if (!setter) {
    			throw new Error(`not implemented ${type} (${name})`);
    		}

    		uniforms.push({ size, type, name, setter, loc });
    	}

    	return uniforms;
    }

    function get_attributes(gl, program) {
    	const attributes = [];

    	const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

    	for (let i = 0; i < n; i += 1) {
    		let { size, type, name } = gl.getActiveAttrib(program, i);
    		name = name.replace('[0]', '');
    		const loc = gl.getAttribLocation(program, name);

    		attributes.push({ size, type, name, loc });
    	}

    	return attributes;
    }

    function deep_set(obj, path, value) {
    	const parts = path.replace(/\]$/, '').split(/\[|\]\.|\./);

    	while (parts.length > 1) {
    		const part = parts.shift();
    		const next = parts[0];

    		if (!obj[part]) obj[part] = /^\d+$/.test(next) ? [] : {};
    		obj = obj[part];
    	}

    	obj[parts[0]] = value;
    }

    class Material {
    	constructor(scene, vert, frag, defines) {
    		this.scene = scene;

    		const gl = scene.gl;
    		this.gl = gl;

    		const { program, uniforms, attributes } = compile(
    			gl,
    			scene.defines + defines + '\n\n' + vert_builtin + '\n\n' + vert,
    			scene.defines + defines + '\n\n' + frag_builtin + '\n\n' + frag
    		);

    		this.program = program;
    		this.uniforms = uniforms;
    		this.attributes = attributes;

    		this.uniform_locations = {};
    		this.uniforms.forEach(uniform => {
    			deep_set(this.uniform_locations, uniform.name, gl.getUniformLocation(this.program, uniform.name));
    		});

    		this.attribute_locations = {};
    		this.attributes.forEach(attribute => {
    			this.attribute_locations[attribute.name] = gl.getAttribLocation(this.program, attribute.name);
    		});

    		this.raw_values = {};
    		this.values = {};
    	}

    	set_uniforms(raw_values) {
    		let texture_index = 0;

    		this.uniforms.forEach(({ name, type, loc, setter, processor }) => {
    			if (name in raw_values) {
    				let data = raw_values[name];

    				if (data === this.raw_values[name]) return;

    				if (type === 35678) {
    					// texture
    					this.values[name] = {
    						texture: data.instantiate(this.scene)._,
    						index: texture_index++
    					};

    					return;
    				}

    				if (typeof data === 'number' && type !== 5126) {
    					// data provided was a number like 0x123456,
    					// but it needs to be an array. for now,
    					// assume it's a color, i.e. vec3
    					data = process_color(data);
    				}

    				this.values[name] = data;
    			}
    		});

    		this.raw_values = raw_values;
    	}

    	apply_uniforms(gl, builtins) {
    		// TODO if this is the only program, maybe
    		// we don't need to re-run this each time
    		this.uniforms.forEach(uniform => {
    			if (uniform.name in this.values) {
    				uniform.setter(gl, uniform.loc, this.values[uniform.name]);
    			}
    		});
    	}

    	destroy() {
    		// TODO
    	}
    }

    var vert_default = "attribute vec3 position;attribute vec3 normal;varying vec3 v_normal;\n#if defined(has_colormap) || defined(has_specularitymap) || defined(has_normalmap) || defined(has_bumpmap)\n#define has_textures true\n#endif\n#ifdef has_textures\nattribute vec2 uv;varying vec2 v_uv;\n#endif\n#if defined(has_normalmap) || defined(has_bumpmap)\nvarying vec3 v_view_position;\n#endif\nvarying vec3 v_surface_to_light[NUM_LIGHTS];\n#ifdef has_specularity\nvarying vec3 v_surface_to_view[NUM_LIGHTS];\n#endif\n#ifdef USE_FOG\nvarying float v_fog_depth;\n#endif\nvoid main(){vec4 pos=vec4(position,1.0);vec4 model_view_pos=VIEW*MODEL*pos;v_normal=(MODEL_INVERSE_TRANSPOSE*vec4(normal,0.0)).xyz;\n#ifdef has_textures\nv_uv=uv;\n#endif\n#if defined(has_normalmap) || defined(has_bumpmap)\nv_view_position=model_view_pos.xyz;\n#endif\n#ifdef USE_FOG\nv_fog_depth=-model_view_pos.z;\n#endif\nfor(int i=0;i<NUM_LIGHTS;i+=1){PointLight light=POINT_LIGHTS[i];vec3 surface_world_position=(MODEL*pos).xyz;v_surface_to_light[i]=light.location-surface_world_position;\n#ifdef has_specularity\nv_surface_to_view[i]=CAMERA_WORLD_POSITION-surface_world_position;\n#endif\n}gl_Position=PROJECTION*model_view_pos;}";

    var frag_default = "\n#if defined(has_colormap) || defined(has_specularitymap) || defined(has_normalmap) || defined(has_bumpmap) || defined(has_emissivemap)\n#define has_textures true\n#endif\n#ifdef has_textures\nvarying vec2 v_uv;\n#endif\n#ifdef has_specularity\nuniform float specularity;\n#endif\n#ifdef has_colormap\nuniform sampler2D colormap;\n#endif\n#ifdef has_emissivemap\nuniform sampler2D emissivemap;\n#endif\n#ifdef has_specularitymap\nuniform sampler2D specularitymap;\n#endif\n#ifdef has_bumpmap\nuniform sampler2D bumpmap;vec2 dHdxy_fwd(){vec2 dSTdx=dFdx(v_uv);vec2 dSTdy=dFdy(v_uv);float Hll=texture2D(bumpmap,v_uv).x;float dBx=texture2D(bumpmap,v_uv+dSTdx).x-Hll;float dBy=texture2D(bumpmap,v_uv+dSTdy).x-Hll;\n#ifdef has_bumpscale\nHll*=bumpscale;dBx*=bumpscale;dBy*=bumpscale;\n#endif\nreturn vec2(dBx,dBy);}vec3 perturbNormalArb(vec3 surf_pos,vec3 surface_normal,vec2 dHdxy){vec3 vSigmaX=vec3(dFdx(surf_pos.x),dFdx(surf_pos.y),dFdx(surf_pos.z));vec3 vSigmaY=vec3(dFdy(surf_pos.x),dFdy(surf_pos.y),dFdy(surf_pos.z));vec3 vN=surface_normal;vec3 R1=cross(vSigmaY,vN);vec3 R2=cross(vN,vSigmaX);float fDet=dot(vSigmaX,R1);fDet*=(float(gl_FrontFacing)*2.0-1.0);vec3 vGrad=sign(fDet)*(dHdxy.x*R1+dHdxy.y*R2);return normalize(abs(fDet)*surface_normal-vGrad);}\n#endif\n#ifdef has_bumpscale\nuniform float bumpscale;\n#endif\n#ifdef has_normalmap\nuniform sampler2D normalmap;vec3 perturbNormal2Arb(vec3 eye_pos,vec3 surface_normal){vec3 q0=vec3(dFdx(eye_pos.x),dFdx(eye_pos.y),dFdx(eye_pos.z));vec3 q1=vec3(dFdy(eye_pos.x),dFdy(eye_pos.y),dFdy(eye_pos.z));vec2 st0=dFdx(v_uv.st);vec2 st1=dFdy(v_uv.st);if(length(q0)==0.0){return surface_normal;}float scale=sign(st1.t*st0.s-st0.t*st1.s);vec3 S=normalize((q0*st1.t-q1*st0.t)*scale);vec3 T=normalize((-q0*st1.s+q1*st0.s)*scale);vec3 N=normalize(surface_normal);mat3 tsn=mat3(S,T,N);vec3 mapN=texture2D(normalmap,v_uv).xyz*2.0-1.0;mapN.xy*=(float(gl_FrontFacing)*2.0-1.0);return normalize(tsn*mapN);}\n#endif\n#ifdef has_color\nuniform vec3 color;\n#endif\n#ifdef has_emissive\nuniform vec3 emissive;\n#endif\n#ifdef has_alpha\nuniform float alpha;\n#endif\n#ifdef USE_FOG\nuniform vec3 FOG_COLOR;uniform float FOG_DENSITY;varying float v_fog_depth;\n#endif\nvarying vec3 v_normal;\n#if defined(has_normalmap) || defined(has_bumpmap)\nvarying vec3 v_view_position;\n#endif\nvarying vec3 v_surface_to_light[NUM_LIGHTS];varying vec3 v_surface_to_view[NUM_LIGHTS];void main(){vec3 normal=normalize(v_normal);\n#ifdef has_bumpmap\nnormal=perturbNormalArb(-v_view_position,normal,dHdxy_fwd());\n#elif defined(has_normalmap)\nnormal=perturbNormal2Arb(-v_view_position,normal);\n#endif\nvec3 lighting=vec3(0.0);vec3 spec_amount=vec3(0.0);for(int i=0;i<NUM_LIGHTS;i+=1){DirectionalLight light=DIRECTIONAL_LIGHTS[i];float multiplier=clamp(dot(normal,-light.direction),0.0,1.0);lighting+=multiplier*light.color*light.intensity;}for(int i=0;i<NUM_LIGHTS;i+=1){PointLight light=POINT_LIGHTS[i];vec3 surface_to_light=normalize(v_surface_to_light[i]);float multiplier=clamp(dot(normal,surface_to_light),0.0,1.0);lighting+=multiplier*light.color*light.intensity;\n#ifdef has_specularity\nvec3 surface_to_view=normalize(v_surface_to_view[i]);vec3 half_vector=normalize(surface_to_light+surface_to_view);float spec=clamp(dot(normal,half_vector),0.0,1.0);\n#ifdef has_specularitymap\nspec*=texture2D(specularitymap,v_uv).r;\n#endif\nspec_amount+=specularity*spec*light.color*light.intensity;\n#endif\n}\n#if defined(has_colormap)\ngl_FragColor=texture2D(colormap,v_uv);\n#elif defined(has_color)\ngl_FragColor=vec4(color,1.0);\n#endif\n#ifdef has_alpha\ngl_FragColor.a*=alpha;\n#endif\ngl_FragColor.rgb*=mix(AMBIENT_LIGHT,vec3(1.0,1.0,1.0),lighting);gl_FragColor.rgb+=spec_amount;\n#if defined(has_emissivemap)\ngl_FragColor.rgb+=texture2D(emissivemap,v_uv);\n#elif defined(has_emissive)\ngl_FragColor.rgb+=emissive;\n#endif\n#ifdef USE_FOG\ngl_FragColor.rgb=mix(gl_FragColor.rgb,FOG_COLOR,1.0-exp(-FOG_DENSITY*FOG_DENSITY*v_fog_depth*v_fog_depth));\n#endif\n}";

    /* node_modules/@sveltejs/gl/scene/Mesh/index.svelte generated by Svelte v3.24.0 */

    const { Object: Object_1 } = globals;

    function create_fragment$3(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $ctm;
    	let { location = [0, 0, 0] } = $$props;
    	let { rotation = [0, 0, 0] } = $$props; // TODO make it possible to set a quaternion as a prop?
    	let { scale = 1 } = $$props;
    	let { geometry } = $$props;
    	let { vert = vert_default } = $$props;
    	let { frag = frag_default } = $$props;
    	let { uniforms = {} } = $$props;
    	let { depthTest = undefined } = $$props;
    	let { doubleSided = undefined } = $$props;
    	let { transparent = false } = $$props;
    	const scene = get_scene();
    	const layer = get_layer();
    	const { ctm } = get_parent();
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(18, $ctm = value));
    	const out = create();
    	const out2 = create();
    	const mesh = {};
    	let existing = true; // track if we've previously added this mesh

    	const add_mesh = () => {
    		layer.add_mesh(mesh, existing);
    		existing = false;
    	};

    	onDestroy(() => {
    		if (mesh.material) mesh.material.destroy();
    	});

    	const writable_props = [
    		"location",
    		"rotation",
    		"scale",
    		"geometry",
    		"vert",
    		"frag",
    		"uniforms",
    		"depthTest",
    		"doubleSided",
    		"transparent"
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Mesh> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Mesh", $$slots, []);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(1, location = $$props.location);
    		if ("rotation" in $$props) $$invalidate(2, rotation = $$props.rotation);
    		if ("scale" in $$props) $$invalidate(3, scale = $$props.scale);
    		if ("geometry" in $$props) $$invalidate(4, geometry = $$props.geometry);
    		if ("vert" in $$props) $$invalidate(5, vert = $$props.vert);
    		if ("frag" in $$props) $$invalidate(6, frag = $$props.frag);
    		if ("uniforms" in $$props) $$invalidate(7, uniforms = $$props.uniforms);
    		if ("depthTest" in $$props) $$invalidate(8, depthTest = $$props.depthTest);
    		if ("doubleSided" in $$props) $$invalidate(9, doubleSided = $$props.doubleSided);
    		if ("transparent" in $$props) $$invalidate(10, transparent = $$props.transparent);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		beforeUpdate,
    		writable,
    		get_scene,
    		get_layer,
    		get_parent,
    		process_color,
    		Material,
    		vert_default,
    		frag_default,
    		mat4,
    		quat,
    		location,
    		rotation,
    		scale,
    		geometry,
    		vert,
    		frag,
    		uniforms,
    		depthTest,
    		doubleSided,
    		transparent,
    		scene,
    		layer,
    		ctm,
    		out,
    		out2,
    		mesh,
    		existing,
    		add_mesh,
    		scale_array,
    		quaternion,
    		matrix,
    		model,
    		$ctm,
    		defines,
    		material_instance,
    		geometry_instance
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(1, location = $$props.location);
    		if ("rotation" in $$props) $$invalidate(2, rotation = $$props.rotation);
    		if ("scale" in $$props) $$invalidate(3, scale = $$props.scale);
    		if ("geometry" in $$props) $$invalidate(4, geometry = $$props.geometry);
    		if ("vert" in $$props) $$invalidate(5, vert = $$props.vert);
    		if ("frag" in $$props) $$invalidate(6, frag = $$props.frag);
    		if ("uniforms" in $$props) $$invalidate(7, uniforms = $$props.uniforms);
    		if ("depthTest" in $$props) $$invalidate(8, depthTest = $$props.depthTest);
    		if ("doubleSided" in $$props) $$invalidate(9, doubleSided = $$props.doubleSided);
    		if ("transparent" in $$props) $$invalidate(10, transparent = $$props.transparent);
    		if ("existing" in $$props) existing = $$props.existing;
    		if ("scale_array" in $$props) $$invalidate(14, scale_array = $$props.scale_array);
    		if ("quaternion" in $$props) $$invalidate(15, quaternion = $$props.quaternion);
    		if ("matrix" in $$props) $$invalidate(16, matrix = $$props.matrix);
    		if ("model" in $$props) $$invalidate(17, model = $$props.model);
    		if ("defines" in $$props) $$invalidate(19, defines = $$props.defines);
    		if ("material_instance" in $$props) $$invalidate(20, material_instance = $$props.material_instance);
    		if ("geometry_instance" in $$props) $$invalidate(21, geometry_instance = $$props.geometry_instance);
    	};

    	let scale_array;
    	let quaternion;
    	let matrix;
    	let model;
    	let defines;
    	let material_instance;
    	let geometry_instance;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*scale*/ 8) {
    			 $$invalidate(14, scale_array = typeof scale === "number"
    			? [scale, scale, scale]
    			: scale);
    		}

    		if ($$self.$$.dirty & /*quaternion, rotation*/ 32772) {
    			 $$invalidate(15, quaternion = fromEuler(quaternion || create$4(), ...rotation));
    		}

    		if ($$self.$$.dirty & /*matrix, quaternion, location, scale_array*/ 114690) {
    			 $$invalidate(16, matrix = fromRotationTranslationScale(matrix || create(), quaternion, location, scale_array));
    		}

    		if ($$self.$$.dirty & /*model, $ctm, matrix*/ 458752) {
    			 $$invalidate(17, model = multiply(model || create(), $ctm, matrix));
    		}

    		if ($$self.$$.dirty & /*uniforms*/ 128) {
    			 $$invalidate(19, defines = Object.keys(uniforms).filter(k => uniforms[k] != null).map(k => `#define has_${k} true\n`).join(""));
    		}

    		if ($$self.$$.dirty & /*vert, frag, defines*/ 524384) {
    			 $$invalidate(20, material_instance = new Material(scene, vert, frag, defines));
    		}

    		if ($$self.$$.dirty & /*material_instance, uniforms*/ 1048704) {
    			 material_instance.set_uniforms(uniforms);
    		}

    		if ($$self.$$.dirty & /*geometry, material_instance*/ 1048592) {
    			 $$invalidate(21, geometry_instance = geometry.instantiate(scene, material_instance.program));
    		}

    		if ($$self.$$.dirty & /*model*/ 131072) {
    			 mesh.model = model;
    		}

    		if ($$self.$$.dirty & /*model*/ 131072) {
    			 mesh.model_inverse_transpose = (invert(out2, model), transpose(out2, out2));
    		}

    		if ($$self.$$.dirty & /*material_instance*/ 1048576) {
    			 mesh.material = material_instance;
    		}

    		if ($$self.$$.dirty & /*geometry_instance*/ 2097152) {
    			 mesh.geometry = geometry_instance;
    		}

    		if ($$self.$$.dirty & /*depthTest*/ 256) {
    			 mesh.depthTest = depthTest;
    		}

    		if ($$self.$$.dirty & /*doubleSided*/ 512) {
    			 mesh.doubleSided = doubleSided;
    		}

    		if ($$self.$$.dirty & /*transparent*/ 1024) {
    			 mesh.transparent = transparent;
    		}

    		if ($$self.$$.dirty & /*transparent*/ 1024) {
    			 (add_mesh());
    		}

    		if ($$self.$$.dirty & /*model, transparent*/ 132096) {
    			 (transparent && (layer.needs_transparency_sort = true));
    		}

    		if ($$self.$$.dirty & /*geometry_instance, model, uniforms*/ 2228352) {
    			 (scene.invalidate());
    		}
    	};

    	return [
    		ctm,
    		location,
    		rotation,
    		scale,
    		geometry,
    		vert,
    		frag,
    		uniforms,
    		depthTest,
    		doubleSided,
    		transparent
    	];
    }

    class Mesh extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			location: 1,
    			rotation: 2,
    			scale: 3,
    			geometry: 4,
    			vert: 5,
    			frag: 6,
    			uniforms: 7,
    			depthTest: 8,
    			doubleSided: 9,
    			transparent: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mesh",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*geometry*/ ctx[4] === undefined && !("geometry" in props)) {
    			console.warn("<Mesh> was created without expected prop 'geometry'");
    		}
    	}

    	get location() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotation() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotation(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get geometry() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set geometry(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vert() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vert(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frag() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frag(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get uniforms() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set uniforms(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get depthTest() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set depthTest(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get doubleSided() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set doubleSided(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transparent() {
    		throw new Error("<Mesh>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transparent(value) {
    		throw new Error("<Mesh>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/Point.svelte generated by Svelte v3.24.0 */

    const get_default_slot_changes$1 = dirty => ({
    	x: dirty & /*x*/ 1,
    	y: dirty & /*y*/ 2,
    	vector: dirty & /*vector*/ 4
    });

    const get_default_slot_context$1 = ctx => ({
    	x: /*x*/ ctx[0],
    	y: /*y*/ ctx[1],
    	vector: /*vector*/ ctx[2]
    });

    function create_fragment$4(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], get_default_slot_context$1);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, x, y, vector*/ 1031) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, get_default_slot_changes$1, get_default_slot_context$1);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $ctm;
    	let $projection;
    	let $view;
    	let $width;
    	let $height;
    	let { location = [0, 0, 0] } = $$props;
    	let { direction = [0, 0, 0] } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { vector = new Float32Array(3) } = $$props;
    	const { width, height, camera_matrix, view, projection } = get_scene();
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(18, $width = value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(19, $height = value));
    	validate_store(view, "view");
    	component_subscribe($$self, view, value => $$invalidate(17, $view = value));
    	validate_store(projection, "projection");
    	component_subscribe($$self, projection, value => $$invalidate(16, $projection = value));
    	const { ctm } = get_parent();
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(14, $ctm = value));
    	let projected = new Float32Array(3);
    	const writable_props = ["location", "direction", "x", "y", "vector"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Point> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Point", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(8, location = $$props.location);
    		if ("direction" in $$props) $$invalidate(9, direction = $$props.direction);
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("vector" in $$props) $$invalidate(2, vector = $$props.vector);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_scene,
    		get_parent,
    		get_camera,
    		vec3,
    		mat4,
    		quat,
    		location,
    		direction,
    		x,
    		y,
    		vector,
    		width,
    		height,
    		camera_matrix,
    		view,
    		projection,
    		ctm,
    		projected,
    		world_position,
    		$ctm,
    		model_view_projection,
    		$projection,
    		$view,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(8, location = $$props.location);
    		if ("direction" in $$props) $$invalidate(9, direction = $$props.direction);
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("vector" in $$props) $$invalidate(2, vector = $$props.vector);
    		if ("projected" in $$props) $$invalidate(12, projected = $$props.projected);
    		if ("world_position" in $$props) $$invalidate(13, world_position = $$props.world_position);
    		if ("model_view_projection" in $$props) $$invalidate(15, model_view_projection = $$props.model_view_projection);
    	};

    	let world_position;
    	let model_view_projection;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*world_position, location, $ctm*/ 24832) {
    			 $$invalidate(13, world_position = transformMat4(world_position || create$1(), location, $ctm));
    		}

    		if ($$self.$$.dirty & /*$projection, $view, $ctm*/ 212992) {
    			 $$invalidate(15, model_view_projection = multiply(create(), multiply(create(), $projection, $view), $ctm));
    		}

    		if ($$self.$$.dirty & /*projected, location, model_view_projection*/ 37120) {
    			 $$invalidate(12, projected = transformMat4(projected, location, model_view_projection));
    		}

    		if ($$self.$$.dirty & /*location, direction, world_position, vector, $ctm, $view*/ 156420) {
    			 {

    				const b_model = [
    					location[0] + direction[0],
    					location[1] + direction[1],
    					location[2] + direction[2]
    				];

    				const a_world = world_position;
    				const b_world = transformMat4(vector, b_model, $ctm);
    				const a_view = transformMat4(create$1(), a_world, $view);
    				const b_view = transformMat4(create$1(), b_world, $view);
    				$$invalidate(2, vector[0] = b_view[0] - a_view[0], vector);
    				$$invalidate(2, vector[1] = b_view[1] - a_view[1], vector);
    				$$invalidate(2, vector[2] = b_view[2] - a_view[2], vector);
    				const mag = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
    				$$invalidate(2, vector[0] /= mag, vector);
    				$$invalidate(2, vector[1] /= mag, vector);
    				$$invalidate(2, vector[2] /= mag, vector);
    			}
    		}

    		if ($$self.$$.dirty & /*$width, projected*/ 266240) {
    			 $$invalidate(0, x = $width * (projected[0] + 1) / 2);
    		}

    		if ($$self.$$.dirty & /*$height, projected*/ 528384) {
    			 $$invalidate(1, y = $height * (1 - (projected[1] + 1) / 2));
    		}
    	};

    	return [
    		x,
    		y,
    		vector,
    		width,
    		height,
    		view,
    		projection,
    		ctm,
    		location,
    		direction,
    		$$scope,
    		$$slots
    	];
    }

    class Point extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			location: 8,
    			direction: 9,
    			x: 0,
    			y: 1,
    			vector: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Point",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get location() {
    		throw new Error("<Point>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Point>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get direction() {
    		throw new Error("<Point>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Point>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Point>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Point>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Point>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Point>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vector() {
    		throw new Error("<Point>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vector(value) {
    		throw new Error("<Point>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/Overlay.svelte generated by Svelte v3.24.0 */
    const file$2 = "node_modules/@sveltejs/gl/scene/Overlay.svelte";
    const get_default_slot_changes$2 = dirty => ({ vector: dirty & /*vector*/ 256 });
    const get_default_slot_context$2 = ctx => ({ vector: /*vector*/ ctx[8] });

    // (11:0) <Point {location} {direction} let:x let:y let:vector>
    function create_default_slot(ctx) {
    	let span;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], get_default_slot_context$2);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", "overlay svelte-1l5epy8");
    			set_style(span, "transform", "translate3d(" + /*px*/ ctx[2](/*x*/ ctx[6]) + ", " + /*px*/ ctx[2](/*y*/ ctx[7]) + ", 0)");
    			add_location(span, file$2, 11, 1, 244);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, vector*/ 288) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_default_slot_changes$2, get_default_slot_context$2);
    				}
    			}

    			if (!current || dirty & /*px, x, y*/ 196) {
    				set_style(span, "transform", "translate3d(" + /*px*/ ctx[2](/*x*/ ctx[6]) + ", " + /*px*/ ctx[2](/*y*/ ctx[7]) + ", 0)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(11:0) <Point {location} {direction} let:x let:y let:vector>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let point;
    	let current;

    	point = new Point({
    			props: {
    				location: /*location*/ ctx[0],
    				direction: /*direction*/ ctx[1],
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ x, y, vector }) => ({ 6: x, 7: y, 8: vector }),
    						({ x, y, vector }) => (x ? 64 : 0) | (y ? 128 : 0) | (vector ? 256 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(point.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(point, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const point_changes = {};
    			if (dirty & /*location*/ 1) point_changes.location = /*location*/ ctx[0];
    			if (dirty & /*direction*/ 2) point_changes.direction = /*direction*/ ctx[1];

    			if (dirty & /*$$scope, px, x, y, vector*/ 484) {
    				point_changes.$$scope = { dirty, ctx };
    			}

    			point.$set(point_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(point.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(point.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(point, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { location } = $$props;
    	let { direction = undefined } = $$props;
    	let { snap = false } = $$props;
    	const writable_props = ["location", "direction", "snap"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Overlay> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Overlay", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(0, location = $$props.location);
    		if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
    		if ("snap" in $$props) $$invalidate(3, snap = $$props.snap);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Point, location, direction, snap, px });

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(0, location = $$props.location);
    		if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
    		if ("snap" in $$props) $$invalidate(3, snap = $$props.snap);
    		if ("px" in $$props) $$invalidate(2, px = $$props.px);
    	};

    	let px;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*snap*/ 8) {
    			 $$invalidate(2, px = n => `${snap ? Math.round(n) : n}px`);
    		}
    	};

    	return [location, direction, px, snap, $$slots, $$scope];
    }

    class Overlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { location: 0, direction: 1, snap: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overlay",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*location*/ ctx[0] === undefined && !("location" in props)) {
    			console.warn("<Overlay> was created without expected prop 'location'");
    		}
    	}

    	get location() {
    		throw new Error("<Overlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Overlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get direction() {
    		throw new Error("<Overlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Overlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get snap() {
    		throw new Error("<Overlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set snap(value) {
    		throw new Error("<Overlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/Target.svelte generated by Svelte v3.24.0 */

    function create_fragment$6(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $ctm;
    	let { id } = $$props;
    	let { location = [0, 0, 0] } = $$props;
    	const { get_target } = get_scene();
    	const { ctm } = get_parent();
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(8, $ctm = value));
    	let model = create();
    	const world_position = new Float32Array(model.buffer, 12 * 4, 3);
    	const loc = new Float32Array(3);
    	const writable_props = ["id", "location"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Target> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Target", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("location" in $$props) $$invalidate(2, location = $$props.location);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		get_scene,
    		get_parent,
    		mat4,
    		id,
    		location,
    		get_target,
    		ctm,
    		model,
    		world_position,
    		loc,
    		x,
    		y,
    		z,
    		$ctm
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("location" in $$props) $$invalidate(2, location = $$props.location);
    		if ("model" in $$props) $$invalidate(3, model = $$props.model);
    		if ("x" in $$props) $$invalidate(5, x = $$props.x);
    		if ("y" in $$props) $$invalidate(6, y = $$props.y);
    		if ("z" in $$props) $$invalidate(7, z = $$props.z);
    	};

    	let x;
    	let y;
    	let z;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*location*/ 4) {
    			// break `location` out into its components, so that we can
    			// skip downstream computations. TODO would be nice if there
    			// was a neater way to achieve this
    			 $$invalidate(5, x = location[0]);
    		}

    		if ($$self.$$.dirty & /*location*/ 4) {
    			 $$invalidate(6, y = location[1]);
    		}

    		if ($$self.$$.dirty & /*location*/ 4) {
    			 $$invalidate(7, z = location[2]);
    		}

    		if ($$self.$$.dirty & /*x, y, z*/ 224) {
    			 ($$invalidate(4, loc[0] = x, loc), $$invalidate(4, loc[1] = y, loc), $$invalidate(4, loc[2] = z, loc));
    		}

    		if ($$self.$$.dirty & /*model, $ctm, loc*/ 280) {
    			 $$invalidate(3, model = translate(model, $ctm, loc));
    		}

    		if ($$self.$$.dirty & /*model, id*/ 10) {
    			 (get_target(id).set(world_position));
    		}
    	};

    	return [ctm, id, location];
    }

    class Target extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { id: 1, location: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Target",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<Target> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<Target>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Target>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get location() {
    		throw new Error("<Target>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<Target>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/lights/AmbientLight.svelte generated by Svelte v3.24.0 */

    function create_fragment$7(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { color = [1, 1, 1] } = $$props;
    	let { intensity = 0.2 } = $$props;
    	const scene = get_scene();
    	const light = {};
    	scene.add_ambient_light(light);
    	const writable_props = ["color", "intensity"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AmbientLight> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AmbientLight", $$slots, []);

    	$$self.$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("intensity" in $$props) $$invalidate(1, intensity = $$props.intensity);
    	};

    	$$self.$capture_state = () => ({
    		get_scene,
    		process_color,
    		color,
    		intensity,
    		scene,
    		light
    	});

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("intensity" in $$props) $$invalidate(1, intensity = $$props.intensity);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 1) {
    			 $$invalidate(2, light.color = process_color(color), light);
    		}

    		if ($$self.$$.dirty & /*intensity*/ 2) {
    			 $$invalidate(2, light.intensity = intensity, light);
    		}

    		if ($$self.$$.dirty & /*light*/ 4) {
    			 (scene.invalidate());
    		}
    	};

    	return [color, intensity];
    }

    class AmbientLight extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { color: 0, intensity: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AmbientLight",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get color() {
    		throw new Error("<AmbientLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<AmbientLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get intensity() {
    		throw new Error("<AmbientLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set intensity(value) {
    		throw new Error("<AmbientLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/lights/DirectionalLight.svelte generated by Svelte v3.24.0 */

    function create_fragment$8(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $ctm;
    	let { direction = new Float32Array([-1, -1, -1]) } = $$props;
    	let { color = new Float32Array([1, 1, 1]) } = $$props;
    	let { intensity = 1 } = $$props;
    	const scene = get_scene();
    	const { ctm } = get_parent();
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(6, $ctm = value));
    	const light = {};
    	scene.add_directional_light(light);
    	const writable_props = ["direction", "color", "intensity"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DirectionalLight> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DirectionalLight", $$slots, []);

    	$$self.$set = $$props => {
    		if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("intensity" in $$props) $$invalidate(3, intensity = $$props.intensity);
    	};

    	$$self.$capture_state = () => ({
    		get_scene,
    		get_parent,
    		process_color,
    		mat4,
    		vec3,
    		direction,
    		color,
    		intensity,
    		scene,
    		ctm,
    		light,
    		multiplied,
    		$ctm
    	});

    	$$self.$inject_state = $$props => {
    		if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("intensity" in $$props) $$invalidate(3, intensity = $$props.intensity);
    		if ("multiplied" in $$props) $$invalidate(5, multiplied = $$props.multiplied);
    	};

    	let multiplied;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*multiplied, direction, $ctm*/ 98) {
    			 $$invalidate(5, multiplied = transformMat4(multiplied || create$1(), direction, $ctm));
    		}

    		if ($$self.$$.dirty & /*light, multiplied*/ 48) {
    			 $$invalidate(4, light.direction = normalize$1(light.direction || create$1(), multiplied), light);
    		}

    		if ($$self.$$.dirty & /*color*/ 4) {
    			 $$invalidate(4, light.color = process_color(color), light);
    		}

    		if ($$self.$$.dirty & /*intensity*/ 8) {
    			 $$invalidate(4, light.intensity = intensity, light);
    		}

    		if ($$self.$$.dirty & /*light*/ 16) {
    			 (scene.invalidate());
    		}
    	};

    	return [ctm, direction, color, intensity];
    }

    class DirectionalLight extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { direction: 1, color: 2, intensity: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DirectionalLight",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get direction() {
    		throw new Error("<DirectionalLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<DirectionalLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<DirectionalLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<DirectionalLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get intensity() {
    		throw new Error("<DirectionalLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set intensity(value) {
    		throw new Error("<DirectionalLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/lights/PointLight.svelte generated by Svelte v3.24.0 */

    function create_fragment$9(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $ctm;
    	let { location = new Float32Array([-1, -1, -1]) } = $$props;
    	let { color = new Float32Array([1, 1, 1]) } = $$props;
    	let { intensity = 1 } = $$props;
    	const scene = get_scene();
    	const { ctm } = get_parent();
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(5, $ctm = value));

    	let light = {
    		// TODO change to a const once bug is fixed
    		location: create$1(),
    		color: null,
    		intensity: null
    	};

    	scene.add_point_light(light);
    	const writable_props = ["location", "color", "intensity"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PointLight> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PointLight", $$slots, []);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(1, location = $$props.location);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("intensity" in $$props) $$invalidate(3, intensity = $$props.intensity);
    	};

    	$$self.$capture_state = () => ({
    		get_scene,
    		get_parent,
    		process_color,
    		mat4,
    		vec3,
    		location,
    		color,
    		intensity,
    		scene,
    		ctm,
    		light,
    		$ctm
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(1, location = $$props.location);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("intensity" in $$props) $$invalidate(3, intensity = $$props.intensity);
    		if ("light" in $$props) $$invalidate(4, light = $$props.light);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*light, location, $ctm*/ 50) {
    			 $$invalidate(4, light.location = transformMat4(light.location, location, $ctm), light);
    		}

    		if ($$self.$$.dirty & /*color*/ 4) {
    			 $$invalidate(4, light.color = process_color(color), light);
    		}

    		if ($$self.$$.dirty & /*intensity*/ 8) {
    			 $$invalidate(4, light.intensity = intensity, light);
    		}

    		if ($$self.$$.dirty & /*light*/ 16) {
    			 (scene.invalidate());
    		}
    	};

    	return [ctm, location, color, intensity];
    }

    class PointLight extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { location: 1, color: 2, intensity: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PointLight",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get location() {
    		throw new Error("<PointLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<PointLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<PointLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<PointLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get intensity() {
    		throw new Error("<PointLight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set intensity(value) {
    		throw new Error("<PointLight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var default_sort = function (item, needle) { return item - needle; };
    function binarySearch(array, search, fn) {
        if (fn === void 0) { fn = default_sort; }
        var low = 0;
        var high = array.length - 1;
        var sort = fn.length === 1
            ? function (item, needle) { return fn(item) - search; }
            : fn;
        while (low <= high) {
            var i = (high + low) >> 1;
            var d = sort(array[i], search);
            if (d < 0) {
                low = i + 1;
            }
            else if (d > 0) {
                high = i - 1;
            }
            else {
                return i;
            }
        }
        return -low - 1;
    }

    function pickRandom(array) {
        var i = ~~(Math.random() * array.length);
        return array[i];
    }

    // http://bost.ocks.org/mike/shuffle/
    function shuffle(array) {
        var m = array.length;
        // While there remain elements to shuffle…
        while (m > 0) {
            // Pick a remaining element…
            var i = Math.floor(Math.random() * m--);
            // And swap it with the current element.
            var t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }

    function queue(max) {
        if (max === void 0) { max = 4; }
        var items = []; // TODO
        var pending = 0;
        var closed = false;
        var fulfil_closed;
        function dequeue() {
            if (pending === 0 && items.length === 0) {
                if (fulfil_closed)
                    fulfil_closed();
            }
            if (pending >= max)
                return;
            if (items.length === 0)
                return;
            pending += 1;
            var _a = items.shift(), fn = _a.fn, fulfil = _a.fulfil, reject = _a.reject;
            var promise = fn();
            try {
                promise.then(fulfil, reject).then(function () {
                    pending -= 1;
                    dequeue();
                });
            }
            catch (err) {
                reject(err);
                pending -= 1;
                dequeue();
            }
            dequeue();
        }
        return {
            add: function (fn) {
                if (closed) {
                    throw new Error("Cannot add to a closed queue");
                }
                return new Promise(function (fulfil, reject) {
                    items.push({ fn: fn, fulfil: fulfil, reject: reject });
                    dequeue();
                });
            },
            close: function () {
                closed = true;
                return new Promise(function (fulfil, reject) {
                    if (pending === 0) {
                        fulfil();
                    }
                    else {
                        fulfil_closed = fulfil;
                    }
                });
            }
        };
    }

    function createSprite(width, height, fn) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        fn(ctx, canvas);
        return canvas;
    }

    function clamp(num, min, max) {
        return num < min ? min : num > max ? max : num;
    }

    function random$2(a, b) {
        if (b === undefined)
            return Math.random() * a;
        return a + Math.random() * (b - a);
    }

    function linear(domain, range) {
        var d0 = domain[0];
        var r0 = range[0];
        var m = (range[1] - r0) / (domain[1] - d0);
        return Object.assign(function (num) {
            return r0 + (num - d0) * m;
        }, {
            inverse: function () { return linear(range, domain); }
        });
    }

    // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    function commas(num) {
        var parts = String(num).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    var yootils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        binarySearch: binarySearch,
        pickRandom: pickRandom,
        shuffle: shuffle,
        queue: queue,
        createSprite: createSprite,
        clamp: clamp,
        random: random$2,
        linearScale: linear,
        commas: commas
    });

    function debounce(fn) {
    	let scheduled = false;
    	let event;

    	function release() {
    		fn(event);
    		scheduled = false;
    	}

    	return function(e) {
    		if (!scheduled) {
    			requestAnimationFrame(release);
    			scheduled = true;
    		}

    		event = e;
    	};
    }

    /* node_modules/@sveltejs/gl/controls/OrbitControls.svelte generated by Svelte v3.24.0 */

    const get_default_slot_changes$3 = dirty => ({
    	location: dirty & /*location*/ 1,
    	target: dirty & /*target*/ 2
    });

    const get_default_slot_context$3 = ctx => ({
    	location: /*location*/ ctx[0],
    	target: /*target*/ ctx[1]
    });

    function create_fragment$a(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], get_default_slot_context$3);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, location, target*/ 67) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, get_default_slot_changes$3, get_default_slot_context$3);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const EPSILON$1 = 0.000001;

    function pythag(a, b) {
    	return Math.sqrt(a * a + b * b);
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const scene = get_scene();
    	let { location = new Float32Array([1, 3, 5]) } = $$props;
    	let { target = new Float32Array([0, 1, 0]) } = $$props;
    	let { minDistance = 0 } = $$props;
    	let { maxDistance = Infinity } = $$props;
    	let { minPolarAngle = 0 } = $$props; // radians
    	let { maxPolarAngle = Math.PI } = $$props; // radians

    	function rotate(x, y) {
    		// TODO handle the up vector. for now, just assume [0,1,0]
    		const vx = location[0] - target[0];

    		const vy = location[1] - target[1];
    		const vz = location[2] - target[2];
    		const radius = Math.sqrt(vx * vx + vy * vy + vz * vz);
    		let theta = Math.atan2(vx, vz);
    		theta -= x;
    		let phi = Math.acos(clamp(vy / radius, -1, 1));
    		phi = clamp(phi - y, EPSILON$1, Math.PI - EPSILON$1);
    		phi = clamp(phi, minPolarAngle, maxPolarAngle);
    		const sin_phi_radius = Math.sin(phi) * radius;
    		const nx = sin_phi_radius * Math.sin(theta);
    		const ny = Math.cos(phi) * radius;
    		const nz = sin_phi_radius * Math.cos(theta);
    		$$invalidate(0, location[0] = target[0] + nx, location);
    		$$invalidate(0, location[1] = target[1] + ny, location);
    		$$invalidate(0, location[2] = target[2] + nz, location);
    	}

    	function pan(dx, dy) {
    		// TODO handle the up vector. for now, just assume [0,1,0]
    		const vx = location[0] - target[0];

    		const vy = location[1] - target[1];
    		const vz = location[2] - target[2];

    		// delta y = along xz
    		{
    			const direction = normalize([vx, vz]);
    			const x = -direction[0] * dy;
    			const z = -direction[1] * dy;
    			$$invalidate(0, location[0] += x, location);
    			$$invalidate(0, location[2] += z, location);
    			$$invalidate(1, target[0] += x, target);
    			$$invalidate(1, target[2] += z, target);
    		}

    		// delta x = tangent to xz
    		{
    			const tangent = normalize([-vz, vx]);
    			const x = tangent[0] * dx;
    			const z = tangent[1] * dx;
    			$$invalidate(0, location[0] += x, location);
    			$$invalidate(0, location[2] += z, location);
    			$$invalidate(1, target[0] += x, target);
    			$$invalidate(1, target[2] += z, target);
    		}
    	}

    	function zoom(amount) {
    		let vx = location[0] - target[0];
    		let vy = location[1] - target[1];
    		let vz = location[2] - target[2];
    		const mag = Math.sqrt(vx * vx + vy * vy + vz * vz);
    		amount = clamp(amount, mag / maxDistance, minDistance ? mag / minDistance : Infinity);
    		vx /= amount;
    		vy /= amount;
    		vz /= amount;
    		$$invalidate(0, location[0] = target[0] + vx, location);
    		$$invalidate(0, location[1] = target[1] + vy, location);
    		$$invalidate(0, location[2] = target[2] + vz, location);
    	}

    	function handle_mousedown(event) {
    		let last_x = event.clientX;
    		let last_y = event.clientY;

    		const handle_mousemove = debounce(event => {
    			const x = event.clientX;
    			const y = event.clientY;
    			const dx = x - last_x;
    			const dy = y - last_y;

    			if (event.shiftKey || event.which === 2) {
    				pan(dx * 0.01, dy * 0.01);
    			} else {
    				rotate(dx * 0.005, dy * 0.005);
    			}

    			last_x = x;
    			last_y = y;
    		});

    		function handle_mouseup(event) {
    			window.removeEventListener("mousemove", handle_mousemove);
    			window.removeEventListener("mouseup", handle_mouseup);
    		}

    		window.addEventListener("mousemove", handle_mousemove);
    		window.addEventListener("mouseup", handle_mouseup);
    	}

    	const mousewheel_zoom = debounce(event => {
    		zoom(Math.pow(1.004, event.wheelDeltaY));
    	});

    	function handle_mousewheel(event) {
    		event.preventDefault();
    		mousewheel_zoom(event);
    	}

    	function start_rotate(event) {
    		event.preventDefault();
    		const touch = event.touches[0];
    		const finger = touch.identifier;
    		let last_x = touch.clientX;
    		let last_y = touch.clientY;

    		const handle_touchmove = debounce(event => {
    			if (event.touches.length > 1) return;
    			const touch = event.touches[0];
    			if (touch.identifier !== finger) return;
    			const dx = touch.clientX - last_x;
    			const dy = touch.clientY - last_y;
    			rotate(dx * 0.003, dy * 0.003);
    			last_x = touch.clientX;
    			last_y = touch.clientY;
    			
    		});

    		function handle_touchend(event) {
    			let i = event.changedTouches.length;

    			while (i--) {
    				const touch = event.changedTouches[i];

    				if (touch.identifier === finger) {
    					window.removeEventListener("touchmove", handle_touchmove);
    					window.removeEventListener("touchend", handle_touchend);
    					return;
    				}
    			}
    		}

    		window.addEventListener("touchmove", handle_touchmove);
    		window.addEventListener("touchend", handle_touchend);
    	}

    	function start_pan_zoom(event) {
    		event.preventDefault();
    		const touch_a = event.touches[0];
    		const touch_b = event.touches[1];
    		const finger_a = touch_a.identifier;
    		const finger_b = touch_b.identifier;
    		let last_cx = (touch_a.clientX + touch_b.clientX) / 2;
    		let last_cy = (touch_a.clientY + touch_b.clientY) / 2;
    		let last_d = pythag(touch_b.clientX - touch_a.clientX, touch_b.clientY - touch_a.clientY);

    		const handle_touchmove = debounce(event => {
    			if (event.touches.length !== 2) {
    				alert(`${event.touches.length} touches`);
    				return;
    			}

    			const touch_a = event.touches[0];
    			const touch_b = event.touches[1];
    			if (touch_a.identifier !== finger_a && touch_a.identifier !== finger_b) return;
    			if (touch_b.identifier !== finger_a && touch_b.identifier !== finger_b) return;
    			const cx = (touch_a.clientX + touch_b.clientX) / 2;
    			const cy = (touch_a.clientY + touch_b.clientY) / 2;
    			const d = pythag(touch_b.clientX - touch_a.clientX, touch_b.clientY - touch_a.clientY);
    			const dx = cx - last_cx;
    			const dy = cy - last_cy;
    			pan(dx * 0.01, dy * 0.01);
    			zoom(d / last_d);
    			last_cx = cx;
    			last_cy = cy;
    			last_d = d;
    		});

    		function handle_touchend(event) {
    			let i = event.changedTouches.length;

    			while (i--) {
    				const touch = event.changedTouches[i];

    				if (touch.identifier === finger_a || touch.identifier === finger_b) {
    					window.removeEventListener("touchmove", handle_touchmove);
    					window.removeEventListener("touchend", handle_touchend);
    					return;
    				}
    			}
    		}

    		window.addEventListener("touchmove", handle_touchmove);
    		window.addEventListener("touchend", handle_touchend);
    	}

    	function handle_touchstart(event) {
    		if (event.touches.length === 1) {
    			start_rotate(event);
    		}

    		if (event.touches.length === 2) {
    			start_pan_zoom(event);
    		}
    	}

    	scene.canvas.addEventListener("mousedown", handle_mousedown);
    	scene.canvas.addEventListener("mousewheel", handle_mousewheel);
    	scene.canvas.addEventListener("touchstart", handle_touchstart);

    	onDestroy(() => {
    		scene.canvas.removeEventListener("mousedown", handle_mousedown);
    		scene.canvas.removeEventListener("mousewheel", handle_mousewheel);
    		scene.canvas.removeEventListener("touchstart", handle_touchstart);
    	});

    	const writable_props = [
    		"location",
    		"target",
    		"minDistance",
    		"maxDistance",
    		"minPolarAngle",
    		"maxPolarAngle"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OrbitControls> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("OrbitControls", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(0, location = $$props.location);
    		if ("target" in $$props) $$invalidate(1, target = $$props.target);
    		if ("minDistance" in $$props) $$invalidate(2, minDistance = $$props.minDistance);
    		if ("maxDistance" in $$props) $$invalidate(3, maxDistance = $$props.maxDistance);
    		if ("minPolarAngle" in $$props) $$invalidate(4, minPolarAngle = $$props.minPolarAngle);
    		if ("maxPolarAngle" in $$props) $$invalidate(5, maxPolarAngle = $$props.maxPolarAngle);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		yootils,
    		debounce,
    		onDestroy,
    		get_scene,
    		normalize,
    		scene,
    		location,
    		target,
    		minDistance,
    		maxDistance,
    		minPolarAngle,
    		maxPolarAngle,
    		EPSILON: EPSILON$1,
    		rotate,
    		pan,
    		zoom,
    		handle_mousedown,
    		mousewheel_zoom,
    		handle_mousewheel,
    		start_rotate,
    		pythag,
    		start_pan_zoom,
    		handle_touchstart
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(0, location = $$props.location);
    		if ("target" in $$props) $$invalidate(1, target = $$props.target);
    		if ("minDistance" in $$props) $$invalidate(2, minDistance = $$props.minDistance);
    		if ("maxDistance" in $$props) $$invalidate(3, maxDistance = $$props.maxDistance);
    		if ("minPolarAngle" in $$props) $$invalidate(4, minPolarAngle = $$props.minPolarAngle);
    		if ("maxPolarAngle" in $$props) $$invalidate(5, maxPolarAngle = $$props.maxPolarAngle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		location,
    		target,
    		minDistance,
    		maxDistance,
    		minPolarAngle,
    		maxPolarAngle,
    		$$scope,
    		$$slots
    	];
    }

    class OrbitControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			location: 0,
    			target: 1,
    			minDistance: 2,
    			maxDistance: 3,
    			minPolarAngle: 4,
    			maxPolarAngle: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OrbitControls",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get location() {
    		throw new Error("<OrbitControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<OrbitControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get target() {
    		throw new Error("<OrbitControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set target(value) {
    		throw new Error("<OrbitControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minDistance() {
    		throw new Error("<OrbitControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minDistance(value) {
    		throw new Error("<OrbitControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxDistance() {
    		throw new Error("<OrbitControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxDistance(value) {
    		throw new Error("<OrbitControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minPolarAngle() {
    		throw new Error("<OrbitControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minPolarAngle(value) {
    		throw new Error("<OrbitControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxPolarAngle() {
    		throw new Error("<OrbitControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxPolarAngle(value) {
    		throw new Error("<OrbitControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/cameras/PerspectiveCamera.svelte generated by Svelte v3.24.0 */

    function create_fragment$b(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $ctm;

    	let $target,
    		$$unsubscribe_target = noop,
    		$$subscribe_target = () => ($$unsubscribe_target(), $$unsubscribe_target = subscribe(target, $$value => $$invalidate(12, $target = $$value)), target);

    	let $width;
    	let $height;
    	$$self.$$.on_destroy.push(() => $$unsubscribe_target());
    	let { location = [0, 0, 0] } = $$props;
    	let { lookAt = null } = $$props;
    	let { up = [0, 1, 0] } = $$props;
    	let { fov = 60 } = $$props;
    	let { near = 1 } = $$props;
    	let { far = 20000 } = $$props;
    	const { add_camera, update_camera, width, height, get_target } = get_scene();
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(13, $width = value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(14, $height = value));
    	const { ctm } = get_parent();
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(11, $ctm = value));
    	const matrix = create();
    	const world_position = new Float32Array(matrix.buffer, 12 * 4, 3);

    	// should be a const, pending https://github.com/sveltejs/svelte/issues/2728
    	let camera = {
    		matrix,
    		world_position,
    		view: create(),
    		projection: create()
    	};

    	let target = writable(null);
    	validate_store(target, "target");
    	$$subscribe_target();
    	add_camera(camera);
    	const writable_props = ["location", "lookAt", "up", "fov", "near", "far"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PerspectiveCamera> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PerspectiveCamera", $$slots, []);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(4, location = $$props.location);
    		if ("lookAt" in $$props) $$invalidate(5, lookAt = $$props.lookAt);
    		if ("up" in $$props) $$invalidate(6, up = $$props.up);
    		if ("fov" in $$props) $$invalidate(7, fov = $$props.fov);
    		if ("near" in $$props) $$invalidate(8, near = $$props.near);
    		if ("far" in $$props) $$invalidate(9, far = $$props.far);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		get_scene,
    		get_parent,
    		mat4,
    		location,
    		lookAt,
    		up,
    		fov,
    		near,
    		far,
    		add_camera,
    		update_camera,
    		width,
    		height,
    		get_target,
    		ctm,
    		matrix,
    		world_position,
    		camera,
    		target,
    		$ctm,
    		$target,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(4, location = $$props.location);
    		if ("lookAt" in $$props) $$invalidate(5, lookAt = $$props.lookAt);
    		if ("up" in $$props) $$invalidate(6, up = $$props.up);
    		if ("fov" in $$props) $$invalidate(7, fov = $$props.fov);
    		if ("near" in $$props) $$invalidate(8, near = $$props.near);
    		if ("far" in $$props) $$invalidate(9, far = $$props.far);
    		if ("camera" in $$props) $$invalidate(10, camera = $$props.camera);
    		if ("target" in $$props) $$subscribe_target($$invalidate(0, target = $$props.target));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lookAt, target*/ 33) {
    			 if (typeof lookAt === "string") {
    				$$subscribe_target($$invalidate(0, target = get_target(lookAt)));
    			} else {
    				target.set(lookAt);
    			}
    		}

    		if ($$self.$$.dirty & /*camera, $ctm, location, $target, up*/ 7248) {
    			 $$invalidate(10, camera.matrix = (translate(camera.matrix, $ctm, location), $target && targetTo(camera.matrix, world_position, $target, up), camera.matrix), camera);
    		}

    		if ($$self.$$.dirty & /*camera*/ 1024) {
    			 $$invalidate(10, camera.view = invert(camera.view, camera.matrix), camera);
    		}

    		if ($$self.$$.dirty & /*camera, fov, $width, $height, near, far*/ 26496) {
    			 $$invalidate(10, camera.projection = perspective(camera.projection, fov / 180 * Math.PI, $width / $height, near, far), camera);
    		}

    		if ($$self.$$.dirty & /*camera*/ 1024) {
    			 update_camera(camera);
    		}
    	};

    	return [target, width, height, ctm, location, lookAt, up, fov, near, far];
    }

    class PerspectiveCamera extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			location: 4,
    			lookAt: 5,
    			up: 6,
    			fov: 7,
    			near: 8,
    			far: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PerspectiveCamera",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get location() {
    		throw new Error("<PerspectiveCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<PerspectiveCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lookAt() {
    		throw new Error("<PerspectiveCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lookAt(value) {
    		throw new Error("<PerspectiveCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get up() {
    		throw new Error("<PerspectiveCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set up(value) {
    		throw new Error("<PerspectiveCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fov() {
    		throw new Error("<PerspectiveCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fov(value) {
    		throw new Error("<PerspectiveCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get near() {
    		throw new Error("<PerspectiveCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set near(value) {
    		throw new Error("<PerspectiveCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get far() {
    		throw new Error("<PerspectiveCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set far(value) {
    		throw new Error("<PerspectiveCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@sveltejs/gl/scene/cameras/OrthoCamera.svelte generated by Svelte v3.24.0 */

    function create_fragment$c(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $ctm;

    	let $target,
    		$$unsubscribe_target = noop,
    		$$subscribe_target = () => ($$unsubscribe_target(), $$unsubscribe_target = subscribe(target, $$value => $$invalidate(11, $target = $$value)), target);

    	let $width;
    	let $height;
    	$$self.$$.on_destroy.push(() => $$unsubscribe_target());
    	let { location = [0, 0, 0] } = $$props;
    	let { lookAt = null } = $$props;
    	let { up = [0, 1, 0] } = $$props;
    	let { near = 1 } = $$props;
    	let { far = 20000 } = $$props;
    	const { add_camera, update_camera, width, height, get_target } = get_scene();
    	validate_store(width, "width");
    	component_subscribe($$self, width, value => $$invalidate(12, $width = value));
    	validate_store(height, "height");
    	component_subscribe($$self, height, value => $$invalidate(13, $height = value));
    	const { ctm } = get_parent();
    	validate_store(ctm, "ctm");
    	component_subscribe($$self, ctm, value => $$invalidate(10, $ctm = value));
    	const matrix = create();
    	const world_position = new Float32Array(matrix.buffer, 12 * 4, 3);

    	// should be a const, pending https://github.com/sveltejs/svelte/issues/2728
    	let camera = {
    		matrix,
    		world_position,
    		view: create(),
    		projection: create()
    	};

    	let target = writable(null);
    	validate_store(target, "target");
    	$$subscribe_target();
    	add_camera(camera);
    	const writable_props = ["location", "lookAt", "up", "near", "far"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OrthoCamera> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("OrthoCamera", $$slots, []);

    	$$self.$set = $$props => {
    		if ("location" in $$props) $$invalidate(4, location = $$props.location);
    		if ("lookAt" in $$props) $$invalidate(5, lookAt = $$props.lookAt);
    		if ("up" in $$props) $$invalidate(6, up = $$props.up);
    		if ("near" in $$props) $$invalidate(7, near = $$props.near);
    		if ("far" in $$props) $$invalidate(8, far = $$props.far);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		get_scene,
    		get_parent,
    		mat4,
    		location,
    		lookAt,
    		up,
    		near,
    		far,
    		add_camera,
    		update_camera,
    		width,
    		height,
    		get_target,
    		ctm,
    		matrix,
    		world_position,
    		camera,
    		target,
    		$ctm,
    		$target,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ("location" in $$props) $$invalidate(4, location = $$props.location);
    		if ("lookAt" in $$props) $$invalidate(5, lookAt = $$props.lookAt);
    		if ("up" in $$props) $$invalidate(6, up = $$props.up);
    		if ("near" in $$props) $$invalidate(7, near = $$props.near);
    		if ("far" in $$props) $$invalidate(8, far = $$props.far);
    		if ("camera" in $$props) $$invalidate(9, camera = $$props.camera);
    		if ("target" in $$props) $$subscribe_target($$invalidate(0, target = $$props.target));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lookAt, target*/ 33) {
    			 if (typeof lookAt === "string") {
    				$$subscribe_target($$invalidate(0, target = get_target(lookAt)));
    			} else {
    				target.set(lookAt);
    			}
    		}

    		if ($$self.$$.dirty & /*camera, $ctm, location, $target, up*/ 3664) {
    			 $$invalidate(9, camera.matrix = (translate(camera.matrix, $ctm, location), $target && targetTo(camera.matrix, world_position, $target, up), camera.matrix), camera);
    		}

    		if ($$self.$$.dirty & /*camera*/ 512) {
    			 $$invalidate(9, camera.view = invert(camera.view, camera.matrix), camera);
    		}

    		if ($$self.$$.dirty & /*camera, $width, $height, near, far*/ 13184) {
    			 $$invalidate(9, camera.projection = ortho(camera.projection, 0, $width, $height, 0, near, far), camera);
    		}

    		if ($$self.$$.dirty & /*camera*/ 512) {
    			 update_camera(camera);
    		}
    	};

    	return [target, width, height, ctm, location, lookAt, up, near, far];
    }

    class OrthoCamera extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			location: 4,
    			lookAt: 5,
    			up: 6,
    			near: 7,
    			far: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OrthoCamera",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get location() {
    		throw new Error("<OrthoCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<OrthoCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lookAt() {
    		throw new Error("<OrthoCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lookAt(value) {
    		throw new Error("<OrthoCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get up() {
    		throw new Error("<OrthoCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set up(value) {
    		throw new Error("<OrthoCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get near() {
    		throw new Error("<OrthoCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set near(value) {
    		throw new Error("<OrthoCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get far() {
    		throw new Error("<OrthoCamera>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set far(value) {
    		throw new Error("<OrthoCamera>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class GeometryInstance {
    	constructor(scene, program, attributes, index, primitive, count) {
    		this.scene = scene;
    		const gl = scene.gl;

    		this.attributes = attributes;
    		this.index = index;
    		this.primitive = primitive;
    		this.count = count;

    		this.locations = {};
    		this.buffers = {};

    		for (const key in attributes) {
    			const attribute = attributes[key];

    			this.locations[key] = gl.getAttribLocation(program, key);

    			const buffer = gl.createBuffer();
    			this.buffers[key] = buffer;

    			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    			gl.bufferData(gl.ARRAY_BUFFER, attribute.data, attribute.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    		}

    		if (index) {
    			const buffer = gl.createBuffer();
    			this.buffers.__index = buffer;
    			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    		}
    	}

    	set_attributes(gl) {
    		for (const key in this.attributes) {
    			const attribute = this.attributes[key];

    			const loc = this.locations[key];
    			if (loc < 0) continue; // attribute is unused by current program

    			const {
    				size = 3,
    				type = gl.FLOAT,
    				normalized = false,
    				stride = 0,
    				offset = 0
    			} = attribute;

    			// Bind the position buffer.
    			const buffer = this.buffers[key];

    			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    			// Turn on the attribute
    			gl.enableVertexAttribArray(loc);

    			gl.vertexAttribPointer(
    				loc,
    				size,
    				type,
    				normalized,
    				stride,
    				offset
    			);
    		}
    	}

    	update(k, data, count) {
    		const scene = this.scene;
    		const { gl } = scene;

    		const attribute = this.attributes[k];
    		const buffer = this.buffers[k];

    		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    		gl.bufferData(gl.ARRAY_BUFFER, attribute.data = data, attribute.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);

    		this.count = count;

    		if (count === Infinity) {
    			throw new Error(`GL.Geometry must be instantiated with one or more { data, size } attributes`);
    		}

    		scene.invalidate();
    	}
    }

    class Geometry {
    	constructor(attributes = {}, opts = {}) {
    		this.attributes = attributes;

    		const { index, primitive = 'TRIANGLES' } = opts;
    		this.index = index;
    		this.primitive = primitive.toUpperCase();
    		this.count = get_count(attributes);

    		this.instances = new Map();
    	}

    	instantiate(scene, program) {
    		if (!this.instances.has(program)) {
    			this.instances.set(program, new GeometryInstance(
    				scene,
    				program,
    				this.attributes,
    				this.index,
    				this.primitive,
    				this.count
    			));
    		}

    		return this.instances.get(program);
    	}

    	update(k, data) {
    		this.attributes[k].data = data;
    		this.count = get_count(this.attributes);

    		this.instances.forEach(instance => {
    			instance.update(k, data, this.count);
    		});
    	}
    }

    function get_count(attributes) {
    	let min = Infinity;

    	for (const k in attributes) {
    		const count = attributes[k].data.length / attributes[k].size;
    		if (count < min) min = count;
    	}

    	return min;
    }

    var box = memoize(() => {
    	let pos = 0.5;
    	let neg = -0.5;

    	return new Geometry({
    		position: {
    			data: new Float32Array([
    				// front
    				pos, pos, pos,
    				neg, pos, pos,
    				pos, neg, pos,
    				neg, neg, pos,

    				// left
    				neg, pos, pos,
    				neg, pos, neg,
    				neg, neg, pos,
    				neg, neg, neg,

    				// back
    				neg, pos, neg,
    				pos, pos, neg,
    				neg, neg, neg,
    				pos, neg, neg,

    				// right
    				pos, pos, neg,
    				pos, pos, pos,
    				pos, neg, neg,
    				pos, neg, pos,

    				// top
    				neg, pos, neg,
    				neg, pos, pos,
    				pos, pos, neg,
    				pos, pos, pos,

    				// bottom
    				neg, neg, pos,
    				neg, neg, neg,
    				pos, neg, pos,
    				pos, neg, neg
    			]),
    			size: 3
    		},

    		normal: {
    			data: new Float32Array([
    				// front
    				0, 0, 1,
    				0, 0, 1,
    				0, 0, 1,
    				0, 0, 1,

    				// left
    				-1, 0, 0,
    				-1, 0, 0,
    				-1, 0, 0,
    				-1, 0, 0,

    				// back
    				 0, 0, -1,
    				 0, 0, -1,
    				 0, 0, -1,
    				 0, 0, -1,

    				// right
    				 1, 0, 0,
    				 1, 0, 0,
    				 1, 0, 0,
    				 1, 0, 0,

    				// top
    				 0, 1, 0,
    				 0, 1, 0,
    				 0, 1, 0,
    				 0, 1, 0,

    				// bottom
    				 0, -1, 0,
    				 0, -1, 0,
    				 0, -1, 0,
    				 0, -1, 0
    			]),
    			size: 3
    		},

    		uv: {
    			data: new Float32Array([
    				// front
    				2/4, 1/4,
    				1/4, 1/4,
    				2/4, 2/4,
    				1/4, 2/4,

    				// left
    				1/4, 1/4,
    				0/4, 1/4,
    				1/4, 2/4,
    				0/4, 2/4,

    				// back
    				4/4, 1/4,
    				3/4, 1/4,
    				4/4, 2/4,
    				3/4, 2/4,

    				// right
    				3/4, 1/4,
    				2/4, 1/4,
    				3/4, 2/4,
    				2/4, 2/4,

    				// top
    				1/4, 0/4,
    				1/4, 1/4,
    				2/4, 0/4,
    				2/4, 1/4,

    				// bottom
    				1/4, 2/4,
    				1/4, 3/4,
    				2/4, 2/4,
    				2/4, 3/4
    			]),
    			size: 2
    		}
    	}, {
    		index: new Uint32Array([
    			// front
    			0, 1, 2,
    			3, 2, 1,

    			// left
    			4, 5, 6,
    			7, 6, 5,

    			// back
    			8, 9, 10,
    			11, 10, 9,

    			// right
    			12, 13, 14,
    			15, 14, 13,

    			// top
    			16, 17, 18,
    			19, 18, 17,

    			// bottom
    			20, 21, 22,
    			23, 22, 21
    		])
    	});
    });

    function create_flat_geometry(radius, height, sides) {
    	const num_vertices = sides * 3;

    	const position_data = new Float32Array(num_vertices * 3 * 2);
    	const normal_data = new Float32Array(num_vertices * 3 * 2);

    	const ny = radius / height;

    	for (let i = 0; i < sides; i += 1) {
    		const start_angle = (i / sides) * Math.PI * 2;
    		const end_angle = ((i + 1) / sides) * Math.PI * 2;
    		const half_angle = (start_angle + end_angle) / 2;

    		let o = i * 3 * 3 * 2;

    		const x1 = Math.sin(start_angle) * radius;
    		const z1 = Math.cos(start_angle) * radius;
    		const x2 = Math.sin(end_angle) * radius;
    		const z2 = Math.cos(end_angle) * radius;

    		// top face
    		position_data[o + 0] = x1;
    		position_data[o + 1] = 0;
    		position_data[o + 2] = z1;

    		position_data[o + 3] = x2;
    		position_data[o + 4] = 0;
    		position_data[o + 5] = z2;

    		position_data[o + 6] = 0;
    		position_data[o + 7] = height;
    		position_data[o + 8] = 0;

    		const nx = Math.sin(half_angle);
    		const nz = Math.cos(half_angle);

    		const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);

    		const nnx = nx / mag;
    		const nny = ny / mag;
    		const nnz = nz / mag;

    		normal_data[o + 0] = normal_data[o + 3] = normal_data[o + 6] = nnx;
    		normal_data[o + 1] = normal_data[o + 4] = normal_data[o + 7] = nny;
    		normal_data[o + 2] = normal_data[o + 5] = normal_data[o + 8] = nnz;

    		o += 9;

    		// bottom face
    		position_data[o + 0] = x2;
    		position_data[o + 1] = 0;
    		position_data[o + 2] = z2;

    		position_data[o + 3] = x1;
    		position_data[o + 4] = 0;
    		position_data[o + 5] = z1;

    		position_data[o + 6] = 0;
    		position_data[o + 7] = 0;
    		position_data[o + 8] = 0;

    		normal_data[o + 0] = normal_data[o + 3] = normal_data[o + 6] = 0;
    		normal_data[o + 1] = normal_data[o + 4] = normal_data[o + 7] = -1;
    		normal_data[o + 2] = normal_data[o + 5] = normal_data[o + 8] = 0;
    	}

    	return new Geometry({
    		position: {
    			data: position_data,
    			size: 3
    		},

    		normal: {
    			data: normal_data,
    			size: 3
    		}
    	});
    }

    function create_smooth_geometry(radius, height, sides) {
    	throw new Error('TODO');
    }

    var cone = memoize(({ radius = 1, height = 1, sides = 12, shading = 'flat' } = {}) => {
    	return shading === 'flat'
    		? create_flat_geometry(radius, height, sides)
    		: create_smooth_geometry();
    });

    // adapted from https://github.com/mrdoob/three.js/blob/master/src/geometries/PolyhedronGeometry.js
    // MIT licensed https://github.com/mrdoob/three.js/blob/dev/LICENSE

    function lerp$3(a, b, t) {
    	return a.map((aa, i) => {
    		const bb = b[i];
    		return aa + (bb - aa) * t;
    	});
    }

    function set2(vector, a, b) {
    	vector[0] = a;
    	vector[1] = b;
    }

    function set3(vector, a, b, c) {
    	vector[0] = a;
    	vector[1] = b;
    	vector[2] = c;
    }

    function correct_uvs(vertex_buffer, uv_buffer) {
    	const a = new Float32Array(3);
    	const b = new Float32Array(3);
    	const c = new Float32Array(3);

    	const centroid = new Float32Array(3);

    	const uv_a = new Float32Array(2);
    	const uv_b = new Float32Array(2);
    	const uv_c = new Float32Array(2);

    	for (let i = 0, j = 0; i < vertex_buffer.length; i += 9, j += 6) {
    		set3(a, vertex_buffer[i + 0], vertex_buffer[i + 1], vertex_buffer[i + 2]);
    		set3(b, vertex_buffer[i + 3], vertex_buffer[i + 4], vertex_buffer[i + 5]);
    		set3(c, vertex_buffer[i + 6], vertex_buffer[i + 7], vertex_buffer[i + 8]);

    		set2(uv_a, uv_buffer[j + 0], uv_buffer[j + 1]);
    		set2(uv_b, uv_buffer[j + 2], uv_buffer[j + 3]);
    		set2(uv_c, uv_buffer[j + 4], uv_buffer[j + 5]);

    		centroid[0] = (a[0] + b[0] + c[0]) / 3;
    		centroid[1] = (a[1] + b[1] + c[1]) / 3;
    		centroid[2] = (a[2] + b[2] + c[2]) / 3;

    		const azi = azimuth(centroid);

    		correct_uv(uv_buffer, uv_a, j + 0, a, azi);
    		correct_uv(uv_buffer, uv_b, j + 2, b, azi);
    		correct_uv(uv_buffer, uv_c, j + 4, c, azi);
    	}
    }

    function correct_uv(uv_buffer, uv, stride, vector, azimuth) {
    	if ((azimuth < 0) && (uv[0] === 1)) {
    		uv_buffer[stride] = uv[0] - 1;
    	}

    	if ((vector[0] === 0) && (vector[2] === 0)) {
    		uv_buffer[stride] = azimuth / 2 / Math.PI + 0.5;
    	}
    }

    function correct_seam(uv_buffer) {
    	// handle case when face straddles the seam
    	for (var i = 0; i < uv_buffer.length; i += 6) {
    		// uv data of a single face
    		var x0 = uv_buffer[i + 0];
    		var x1 = uv_buffer[i + 2];
    		var x2 = uv_buffer[i + 4];

    		var max = Math.max(x0, x1, x2);
    		var min = Math.min(x0, x1, x2);

    		// 0.9 is somewhat arbitrary
    		if (max > 0.9 && min < 0.1) {
    			if (x0 < 0.2) uv_buffer[i + 0] += 1;
    			if (x1 < 0.2) uv_buffer[i + 2] += 1;
    			if (x2 < 0.2) uv_buffer[i + 4] += 1;
    		}
    	}
    }

    // Angle around the Y axis, counter-clockwise when looking from above.
    function azimuth(vector) {
    	return Math.atan2(vector[2], - vector[0]);
    }

    // Angle above the XZ plane.
    function inclination(vector) {
    	return Math.atan2(-vector[1], Math.sqrt((vector[0] * vector[0]) + (vector[2] * vector[2])));
    }

    function compute_vertex_normals(position) {
    	const cb = new Float32Array(3);
    	const ab = new Float32Array(3);

    	const normals = new Float32Array(position.length);

    	for (let i = 0; i < position.length; i += 9 ) {
    		const pa = position.subarray(i + 0, i + 3);
    		const pb = position.subarray(i + 3, i + 6);
    		const pc = position.subarray(i + 6, i + 9);

    		set3(cb, pc[0] - pb[0], pc[1] - pb[1], pc[2] - pb[2]);
    		set3(ab, pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);

    		// cb x ab
    		const x = cb[1] * ab[2] - cb[2] * ab[1];
    		const y = cb[2] * ab[0] - cb[0] * ab[2];
    		const z = cb[0] * ab[1] - cb[1] * ab[0];

    		normals[i + 0] = normals[i + 3] = normals[i + 6] = x;
    		normals[i + 1] = normals[i + 4] = normals[i + 7] = y;
    		normals[i + 2] = normals[i + 5] = normals[i + 8] = z;
    	}

    	return normals;
    }

    function create_vertex_buffer(vertices, indices, subdivisions) {
    	const vertex_buffer = [];

    	const a = new Float32Array(3);
    	const b = new Float32Array(3);
    	const c = new Float32Array(3);

    	for (let i = 0; i < indices.length; i += 3) {
    		// get the vertices of the face
    		get_vertex_data(indices[i + 0], a);
    		get_vertex_data(indices[i + 1], b);
    		get_vertex_data(indices[i + 2], c);

    		// perform subdivision
    		subdivide_face(a, b, c, subdivisions);
    	}

    	function get_vertex_data(index, out) {
    		const offset = index * 3;

    		out[0] = vertices[offset + 0];
    		out[1] = vertices[offset + 1];
    		out[2] = vertices[offset + 2];
    	}

    	function push_vertex(vertex) {
    		vertex_buffer.push(vertex[0], vertex[1], vertex[2]);
    	}

    	function subdivide_face(a, b, c, subdivisions) {
    		const cols = Math.pow(2, subdivisions);

    		// we use this multidimensional array as a data structure for creating the subdivision
    		const v = [];

    		// construct all of the vertices for this subdivision
    		for (let i = 0; i <= cols; i++) {
    			v[i] = [];

    			const aj = lerp$3(a, c, i / cols);
    			const bj = lerp$3(b, c, i / cols);

    			const rows = cols - i;

    			for (let j = 0; j <= rows; j++) {
    				if (j === 0 && i === cols) {
    					v[i][j] = aj;
    				} else {
    					v[i][j] = lerp$3(aj, bj, j / rows);
    				}
    			}
    		}

    		// construct all of the faces
    		for (let i = 0; i < cols; i++) {
    			for (let j = 0; j < 2 * (cols - i) - 1; j++) {
    				const k = Math.floor(j / 2);

    				if (j % 2 === 0) {
    					push_vertex(v[i][k + 1]);
    					push_vertex(v[i + 1][k]);
    					push_vertex(v[i][k]);
    				} else {
    					push_vertex(v[i][k + 1]);
    					push_vertex(v[i + 1][k + 1]);
    					push_vertex(v[i + 1][k]);
    				}
    			}
    		}
    	}

    	return new Float32Array(vertex_buffer);
    }

    var polyhedron = memoize((vertices, indices, subdivisions = 0, shading = 'flat') => {
    	var uv_buffer = [];

    	// the subdivision creates the vertex buffer data
    	const vertex_buffer = create_vertex_buffer(vertices, indices, subdivisions);

    	for (let i = 0; i < vertex_buffer.length; i += 3) {
    		const vertex = new Float32Array(vertex_buffer.buffer, i * 4, 3);

    		// all vertices should lie on a conceptual sphere with a given radius
    		normalize(vertex);

    		var u = azimuth(vertex) / 2 / Math.PI + 0.5;
    		var v = inclination(vertex) / Math.PI + 0.5;
    		uv_buffer.push(u, 1 - v);
    	}

    	correct_uvs(vertex_buffer, uv_buffer);
    	correct_seam(uv_buffer);

    	const position_buffer = new Float32Array(vertex_buffer);

    	return new Geometry({
    		position: {
    			data: position_buffer,
    			size: 3
    		},

    		normal: {
    			data: shading === 'smooth' ? position_buffer : compute_vertex_normals(position_buffer),
    			size: 3
    		},

    		uv: {
    			data: new Float32Array(uv_buffer),
    			size: 2
    		}
    	});
    });

    // adapted from https://github.com/mrdoob/three.js/blob/master/src/geometries/DodecahedronGeometry.js
    // MIT licensed https://github.com/mrdoob/three.js/blob/dev/LICENSE

    const t = ( 1 + Math.sqrt( 5 ) ) / 2;
    const r = 1 / t;

    const vertices = [
    	// (±1, ±1, ±1)
    	-1, -1, -1, -1, -1, +1,
    	-1, +1, -1, -1, +1, +1,
    	+1, -1, -1, +1, -1, +1,
    	+1, +1, -1, +1, +1, +1,

    	// (0, ±1/φ, ±φ)
    	0, -r, -t, 0, -r, +t,
    	0, +r, -t, 0, +r, +t,

    	// (±1/φ, ±φ, 0)
    	-r, -t, 0, -r, +t, 0,
    	+r, -t, 0, +r, +t, 0,

    	// (±φ, 0, ±1/φ)
    	-t, 0, -r, +t, 0, -r,
    	-t, 0, +r, +t, 0, +r
    ];

    const indices = [
    	3, 11, 7, 	3, 7, 15, 	3, 15, 13,
    	7, 19, 17, 	7, 17, 6, 	7, 6, 15,
    	17, 4, 8, 	17, 8, 10, 	17, 10, 6,
    	8, 0, 16, 	8, 16, 2, 	8, 2, 10,
    	0, 12, 1, 	0, 1, 18, 	0, 18, 16,
    	6, 10, 2, 	6, 2, 13, 	6, 13, 15,
    	2, 16, 18, 	2, 18, 3, 	2, 3, 13,
    	18, 1, 9, 	18, 9, 11, 	18, 11, 3,
    	4, 14, 12, 	4, 12, 0, 	4, 0, 8,
    	11, 9, 5, 	11, 5, 19, 	11, 19, 7,
    	19, 5, 14, 	19, 14, 4, 	19, 4, 17,
    	1, 12, 14, 	1, 14, 5, 	1, 5, 9
    ];

    function dodecahedron({ subdivisions, shading } = {}) {
    	return polyhedron(vertices, indices, subdivisions, shading);
    }

    var plane = memoize(() => {
    	return new Geometry({
    		position: {
    			data: new Float32Array([
    				 1,  1, 0,
    				-1,  1, 0,
    				 1, -1, 0,
    				-1, -1, 0,
    			]),
    			size: 3
    		},

    		normal: {
    			data: new Float32Array([
    				0, 0, 1,
    				0, 0, 1,
    				0, 0, 1,
    				0, 0, 1
    			]),
    			size: 3
    		},

    		uv: {
    			data: new Float32Array([
    				1, 0,
    				0, 0,
    				1, 1,
    				0, 1
    			]),
    			size: 2
    		}
    	}, {
    		index: new Uint32Array([
    			0, 1, 2,
    			3, 2, 1
    		])
    	});
    });

    const p = 0.85065080835204;
    const q = 0.5257311121191336;

    const position = new Float32Array([
    	-q, +p,  0,
    	+q, +p,  0,
    	-q, -p,  0,
    	+q, -p,  0,
    	 0, -q, +p,
    	 0, +q, +p,
    	 0, -q, -p,
    	 0, +q, -p,
    	+p,  0, -q,
    	+p,  0, +q,
    	-p,  0, -q,
    	-p,  0, +q
    ]);

    const index = new Uint16Array([
    	0, 11, 5,
    	0, 5, 1,
    	0, 1, 7,
    	0, 7, 10,
    	0, 10, 11,
    	1, 5, 9,
    	5, 11, 4,
    	11, 10, 2,
    	10, 7, 6,
    	7, 1, 8,
    	3, 9, 4,
    	3, 4, 2,
    	3, 2, 6,
    	3, 6, 8,
    	3, 8, 9,
    	4, 9, 5,
    	2, 4, 11,
    	6, 2, 10,
    	8, 6, 7,
    	9, 8, 1
    ]);

    const smooth_geometry = [
    	new Geometry({
    		position: { data: position, size: 3 },
    		normal: { data: position, size: 3 }
    	}, { index })
    ];

    function subdivide(geometry) {
    	const index = new Uint32Array(geometry.index.length * 4);

    	const old_position = geometry.attributes.position.data;
    	const new_positions = [];
    	const lookup = new Map();

    	function get_index(point) {
    		const hash = `${point[0].toPrecision(6)},${point[1].toPrecision(6)},${point[2].toPrecision(6)}`;

    		if (lookup.has(hash)) {
    			return lookup.get(hash);
    		}

    		const index = new_positions.length;
    		lookup.set(hash, index);
    		new_positions[index] = point;
    		return index;
    	}

    	function mid(a, b) {
    		return get_index([
    			(a[0] + b[0]) / 2,
    			(a[1] + b[1]) / 2,
    			(a[2] + b[2]) / 2
    		]);
    	}

    	for (let i = 0; i < geometry.index.length; i += 3) {
    		const c0 = geometry.index[i + 0];
    		const c1 = geometry.index[i + 1];
    		const c2 = geometry.index[i + 2];

    		const v0 = [
    			old_position[c0 * 3 + 0],
    			old_position[c0 * 3 + 1],
    			old_position[c0 * 3 + 2]
    		];

    		const v1 = [
    			old_position[c1 * 3 + 0],
    			old_position[c1 * 3 + 1],
    			old_position[c1 * 3 + 2]
    		];

    		const v2 = [
    			old_position[c2 * 3 + 0],
    			old_position[c2 * 3 + 1],
    			old_position[c2 * 3 + 2]
    		];

    		const a = mid(v0, v1);
    		const b = mid(v1, v2);
    		const c = mid(v2, v0);

    		// four new faces
    		const j = i * 4;

    		index[j + 0] = get_index(v0);
    		index[j + 1] = a;
    		index[j + 2] = c;

    		index[j + 3] = get_index(v1);
    		index[j + 4] = b;
    		index[j + 5] = a;

    		index[j + 6] = get_index(v2);
    		index[j + 7] = c;
    		index[j + 8] = b;

    		index[j + 9] = a;
    		index[j + 10] = b;
    		index[j + 11] = c;
    	}

    	const position = new Float32Array(new_positions.length * 3);
    	for (let i = 0; i < new_positions.length; i += 1) {
    		const vector = normalize(new_positions[i]);

    		position[i * 3 + 0] = vector[0];
    		position[i * 3 + 1] = vector[1];
    		position[i * 3 + 2] = vector[2];
    	}

    	return new Geometry({
    		position: { data: position, size: 3 },
    		normal: { data: position, size: 3 }
    	}, { index })
    }

    function create_smooth_geometry$1(subdivisions = 0) {
    	if (!smooth_geometry[subdivisions]) {
    		const geometry = create_smooth_geometry$1(subdivisions - 1);
    		smooth_geometry[subdivisions] = subdivide(geometry);
    	}

    	return smooth_geometry[subdivisions];
    }

    function create_flat_geometry$1(subdivisions) {
    	throw new Error(`TODO implement flat sphere geometry`);
    }

    var icosphere = memoize(({ subdivisions = 0, shading = 'smooth' } = {}) => {
    	return shading === 'smooth'
    		? create_smooth_geometry$1(subdivisions)
    		: create_flat_geometry$1();
    });

    const PI = Math.PI;
    const PI2 = PI * 2;

    function create_smooth_geometry$2(turns, bands) {
    	const num_vertices = (turns + 1) * (bands + 1);
    	const num_faces_per_turn = 2 * (bands - 1);
    	const num_faces = num_faces_per_turn * turns;

    	const position = new Float32Array(num_vertices * 3); // doubles as normal
    	const uv = new Float32Array(num_vertices * 2);
    	const index = new Uint32Array(num_faces * 3);

    	let position_index = 0;
    	let uv_index = 0;

    	for (let i = 0; i <= turns; i += 1) {
    		const u = i / turns;

    		for (let j = 0; j <= bands; j += 1) {
    			const v = j / bands;

    			const x = -Math.cos(u * PI2) * Math.sin(v * PI);
    			const y = Math.cos(v * PI);
    			const z = Math.sin(u * PI2) * Math.sin(v * PI);

    			position[position_index++] = x;
    			position[position_index++] = y;
    			position[position_index++] = z;

    			uv[uv_index++] = u;
    			uv[uv_index++] = v;
    		}
    	}

    	let face_index = 0;

    	for (let i = 0; i < turns; i += 1) {
    		const offset = i * (bands + 1);

    		// north pole face
    		index[face_index++] = offset + 0;
    		index[face_index++] = offset + 1;
    		index[face_index++] = offset + bands + 2;

    		for (let j = 1; j < bands - 1; j += 1) {
    			index[face_index++] = offset + j;
    			index[face_index++] = offset + j + 1;
    			index[face_index++] = offset + j + bands + 1;

    			index[face_index++] = offset + j + bands + 1;
    			index[face_index++] = offset + j + 1;
    			index[face_index++] = offset + j + bands + 2;
    		}

    		index[face_index++] = offset + bands - 1;
    		index[face_index++] = offset + bands;
    		index[face_index++] = offset + bands * 2;
    	}

    	return new Geometry({
    		position: {
    			data: position,
    			size: 3
    		},
    		normal: {
    			data: position,
    			size: 3
    		},
    		uv: {
    			data: uv,
    			size: 2
    		}
    	}, {
    		index
    	});
    }

    function create_flat_geometry$2(turns, bands) {
    	throw new Error('TODO implement flat geometry');
    }

    var sphere = memoize(({ turns = 8, bands = 6, shading = 'smooth' } = {}) => {
    	return shading === 'smooth'
    		? create_smooth_geometry$2(turns, bands)
    		: create_flat_geometry$2();
    });

    // https://www.khronos.org/registry/webgl/specs/1.0/
    const UNSIGNED_BYTE                  = 0x1401;
    const RGBA                           = 0x1908;
    const LINEAR                         = 0x2601;
    const TEXTURE_MIN_FILTER             = 0x2801;
    const TEXTURE_WRAP_S                 = 0x2802;
    const TEXTURE_WRAP_T                 = 0x2803;

    /* TextureTarget */
    const TEXTURE_2D                     = 0x0DE1;
    const CLAMP_TO_EDGE                  = 0x812F;

    const worker_url = (typeof Blob !== 'undefined' && URL.createObjectURL(new Blob(
    	[`self.onmessage = e => { self.onmessage = null; eval(e.data); };`],
    	{ type: 'application/javascript' }
    ))) || typeof window !== 'undefined' && window.SVELTE_GL_WORKER_URL;

    const image_cache = new Map();

    function load_image(src) {
    	if (!worker_url) {
    		throw new Error(`Workers cannot be created from Blob URLs in this browser. Please set SVELTE_GL_WORKER_URL`);
    	}

    	if (!image_cache.has(src)) {
    		image_cache.set(src, new Promise((fulfil, reject) => {
    			if (typeof createImageBitmap !== 'undefined') {
    				// TODO pool workers?
    				const worker = create_worker(worker_url, () => {
    					self.onmessage = e => {
    						fetch(e.data, { mode: 'cors' })
    							.then(response => response.blob())
    							.then(blobData => createImageBitmap(blobData))
    							.then(bitmap => {
    								self.postMessage({ bitmap }, [bitmap]);
    							})
    							.catch(error => {
    								self.postMessage({
    									error: {
    										message: error.message,
    										stack: error.stack
    									}
    								});
    							});
    					};
    				});

    				worker.onmessage = e => {
    					if (e.data.error) {
    						image_cache.delete(src);
    						reject(e.data.error);
    					}

    					else fulfil(e.data.bitmap);
    				};

    				worker.postMessage(new URL(src, location.href).href);
    			} else {
    				const img = new Image();
    				img.crossOrigin = '';
    				img.onload = () => fulfil(img);
    				img.onerror = e => {
    					image_cache.delete(src);
    					reject(e);
    				};
    				img.src = src;
    			}
    		}));
    	}

    	return image_cache.get(src);
    }

    const is_power_of_two = n => (n & (n - 1)) === 0;

    const black_pixel = new Uint8Array([0, 0, 0, 255]);

    class TextureInstance {
    	constructor(scene, texture) {
    		const { gl } = scene;

    		this._ = gl.createTexture();

    		if (typeof texture.data === 'string') {
    			this.bind(gl, texture, black_pixel);

    			texture.ready.then(() => {
    				this.bind(gl, texture, texture.data);
    				scene.invalidate();
    			});
    		} else {
    			this.bind(gl, texture, texture.data);
    		}
    	}

    	bind(gl, texture, data) {
    		gl.bindTexture(TEXTURE_2D, this._);

    		if (ArrayBuffer.isView(data)) {
    			// TODO figure out where this goes
    			const width = 1;
    			const height = 1;

    			gl.texImage2D(TEXTURE_2D, 0, RGBA, width, height, 0, RGBA, UNSIGNED_BYTE, data);
    		} else {
    			gl.texImage2D(TEXTURE_2D, 0, RGBA, RGBA, UNSIGNED_BYTE, data);
    		}

    		const width  = 'naturalWidth'  in data ? data.naturalWidth  : data.width;
    		const height = 'naturalHeight' in data ? data.naturalHeight : data.height;

    		if (is_power_of_two(width) && is_power_of_two(height)) {
    			gl.generateMipmap(TEXTURE_2D);

    			gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_S, texture.opts.wrapS);
    			gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_T, texture.opts.wrapT);
    			gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, texture.opts.minFilter);
    		} else {
    			gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_S, CLAMP_TO_EDGE);
    			gl.texParameteri(TEXTURE_2D, TEXTURE_WRAP_T, CLAMP_TO_EDGE);
    			gl.texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, LINEAR);
    		}
    	}
    }

    const caches$1 = new Map();
    let resolved;

    class Texture {
    	constructor(data, opts = {}) {
    		this.data = data;

    		this.opts = {
    			width:          opts.width     || 1,
    			height:         opts.height    || 1,
    			internalFormat: opts.format    || RGBA,
    			srcFormat:      opts.srcFormat || RGBA,
    			srcType:        opts.srcType   || UNSIGNED_BYTE,
    			wrapS:          opts.wrapS     || CLAMP_TO_EDGE,
    			wrapT:          opts.wrapT     || CLAMP_TO_EDGE,
    			minFilter:      opts.minFilter || LINEAR
    		};

    		// TODO clamp, mipmaps, etc

    		this.hash = JSON.stringify(this.opts);

    		this.ready = typeof data === 'string'
    			? load_image(data).then(img => {
    				this.data = img;
    			})
    			: resolved || (resolved = Promise.resolve());
    	}

    	instantiate(scene, index) {
    		if (!caches$1.has(scene)) caches$1.set(scene, new Map());
    		const a = caches$1.get(scene);

    		if (!a.has(this.data)) a.set(this.data, new Map());
    		const b = a.get(this.data);

    		if (!b.has(this.hash)) b.set(this.hash, new TextureInstance(scene, this, index));
    		return b.get(this.hash);
    	}
    }

    // scene

    var GL = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Scene: Scene,
        Group: Group,
        Layer: Layer,
        Mesh: Mesh,
        Overlay: Overlay,
        Point: Point,
        Target: Target,
        AmbientLight: AmbientLight,
        DirectionalLight: DirectionalLight,
        PointLight: PointLight,
        OrbitControls: OrbitControls,
        PerspectiveCamera: PerspectiveCamera,
        OrthoCamera: OrthoCamera,
        Geometry: Geometry,
        box: box,
        cone: cone,
        dodecahedron: dodecahedron,
        plane: plane,
        icosphere: icosphere,
        sphere: sphere,
        Texture: Texture
    });

    /* App.svelte generated by Svelte v3.24.0 */
    const file$3 = "App.svelte";

    // (50:4) <GL.OrbitControls maxPolarAngle={Math.PI / 2} let:location>
    function create_default_slot_2(ctx) {
    	let gl_perspectivecamera;
    	let current;

    	gl_perspectivecamera = new PerspectiveCamera({
    			props: {
    				location: [15, 5.5, 5],
    				lookAt: [5, 1, 5],
    				near: 0.01,
    				far: 1000
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gl_perspectivecamera.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gl_perspectivecamera, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gl_perspectivecamera.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gl_perspectivecamera.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gl_perspectivecamera, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(50:4) <GL.OrbitControls maxPolarAngle={Math.PI / 2} let:location>",
    		ctx
    	});

    	return block;
    }

    // (97:4) <GL.Group location={[light.x, 3, 3]}>
    function create_default_slot_1(ctx) {
    	let gl_mesh;
    	let t;
    	let gl_pointlight;
    	let current;

    	gl_mesh = new Mesh({
    			props: {
    				geometry: sphere({ turns: 36, bands: 36 }),
    				location: [0, 0.2, 0],
    				scale: 0,
    				uniforms: { color: 16777215, emissive: 13421721 }
    			},
    			$$inline: true
    		});

    	gl_pointlight = new PointLight({
    			props: {
    				location: [0, 0, 0],
    				color: 16777215,
    				intensity: 0.6
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gl_mesh.$$.fragment);
    			t = space();
    			create_component(gl_pointlight.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gl_mesh, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(gl_pointlight, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gl_mesh.$$.fragment, local);
    			transition_in(gl_pointlight.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gl_mesh.$$.fragment, local);
    			transition_out(gl_pointlight.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gl_mesh, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(gl_pointlight, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(97:4) <GL.Group location={[light.x, 3, 3]}>",
    		ctx
    	});

    	return block;
    }

    // (47:2) <GL.Scene>
    function create_default_slot$1(ctx) {
    	let gl_orbitcontrols;
    	let t0;
    	let gl_directionallight;
    	let t1;
    	let gl_mesh0;
    	let t2;
    	let gl_mesh1;
    	let t3;
    	let gl_mesh2;
    	let t4;
    	let gl_group;
    	let current;

    	gl_orbitcontrols = new OrbitControls({
    			props: {
    				maxPolarAngle: Math.PI / 2,
    				$$slots: {
    					default: [
    						create_default_slot_2,
    						({ location }) => ({ 7: location }),
    						({ location }) => location ? 128 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	gl_directionallight = new DirectionalLight({
    			props: { direction: [-1, -1, -1], intensity: 0.5 },
    			$$inline: true
    		});

    	gl_mesh0 = new Mesh({
    			props: {
    				geometry: plane(),
    				location: [0, -0.01, 4],
    				rotation: [-90, 0, 0],
    				scale: 10,
    				uniforms: { color: /*from_hex*/ ctx[3]("#8C8C88") }
    			},
    			$$inline: true
    		});

    	gl_mesh1 = new Mesh({
    			props: {
    				geometry: box(),
    				location: [-1, /*h*/ ctx[1] / 2, 4],
    				rotation: [0, 0, 0],
    				scale: [2, 1.5, 2],
    				uniforms: { color: /*from_hex*/ ctx[3]("#2d85a8") }
    			},
    			$$inline: true
    		});

    	gl_mesh2 = new Mesh({
    			props: {
    				geometry: sphere({ turns: 36, bands: 36 }),
    				location: [/*sun*/ ctx[0].x, /*sun*/ ctx[0].y, /*sun*/ ctx[0].z],
    				scale: 0.6,
    				uniforms: {
    					color: /*from_hex*/ ctx[3]("#e1e6b3"),
    					alpha: 0.9
    				},
    				transparent: true
    			},
    			$$inline: true
    		});

    	gl_group = new Group({
    			props: {
    				location: [/*light*/ ctx[2].x, 3, 3],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gl_orbitcontrols.$$.fragment);
    			t0 = space();
    			create_component(gl_directionallight.$$.fragment);
    			t1 = space();
    			create_component(gl_mesh0.$$.fragment);
    			t2 = space();
    			create_component(gl_mesh1.$$.fragment);
    			t3 = space();
    			create_component(gl_mesh2.$$.fragment);
    			t4 = space();
    			create_component(gl_group.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gl_orbitcontrols, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(gl_directionallight, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(gl_mesh0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(gl_mesh1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(gl_mesh2, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(gl_group, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gl_orbitcontrols_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				gl_orbitcontrols_changes.$$scope = { dirty, ctx };
    			}

    			gl_orbitcontrols.$set(gl_orbitcontrols_changes);
    			const gl_mesh2_changes = {};
    			if (dirty & /*sun*/ 1) gl_mesh2_changes.location = [/*sun*/ ctx[0].x, /*sun*/ ctx[0].y, /*sun*/ ctx[0].z];
    			gl_mesh2.$set(gl_mesh2_changes);
    			const gl_group_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				gl_group_changes.$$scope = { dirty, ctx };
    			}

    			gl_group.$set(gl_group_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gl_orbitcontrols.$$.fragment, local);
    			transition_in(gl_directionallight.$$.fragment, local);
    			transition_in(gl_mesh0.$$.fragment, local);
    			transition_in(gl_mesh1.$$.fragment, local);
    			transition_in(gl_mesh2.$$.fragment, local);
    			transition_in(gl_group.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gl_orbitcontrols.$$.fragment, local);
    			transition_out(gl_directionallight.$$.fragment, local);
    			transition_out(gl_mesh0.$$.fragment, local);
    			transition_out(gl_mesh1.$$.fragment, local);
    			transition_out(gl_mesh2.$$.fragment, local);
    			transition_out(gl_group.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gl_orbitcontrols, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(gl_directionallight, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(gl_mesh0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(gl_mesh1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(gl_mesh2, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(gl_group, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(47:2) <GL.Scene>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let gl_scene;
    	let current;

    	gl_scene = new Scene({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(gl_scene.$$.fragment);
    			attr_dev(div, "class", "m4");
    			add_location(div, file$3, 45, 0, 873);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(gl_scene, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const gl_scene_changes = {};

    			if (dirty & /*$$scope, sun*/ 257) {
    				gl_scene_changes.$$scope = { dirty, ctx };
    			}

    			gl_scene.$set(gl_scene_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gl_scene.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gl_scene.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(gl_scene);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let w = 1;
    	let h = 1;
    	let d = 1;
    	const light = { x: 1, y: 1, z: 1 };

    	// far,
    	const sun = { x: 0, y: 1, z: 2 };

    	const from_hex = hex => parseInt(hex.slice(1), 16);

    	const orbitY = function (x) {
    		// console.log(x)
    		return x;
    	};

    	onMount(() => {
    		let frame;

    		const loop = () => {
    			frame = requestAnimationFrame(loop);

    			// light.x = 3 * Math.sin(Date.now() * 0.001)
    			// light.y = 2.5 + 2 * Math.sin(Date.now() * 0.0004)
    			// light.z = 3 * Math.cos(Date.now() * 0.002)
    			// console.log(light)
    			$$invalidate(0, sun.z += 0.01, sun);

    			$$invalidate(0, sun.y = orbitY(sun.z), sun);
    		}; // sun.y = 2.5 + 2 * Math.sin(Date.now() * 0.0004)
    		// sun.z = 3 * Math.cos(Date.now() * 0.002)

    		loop();
    		return () => cancelAnimationFrame(frame);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		onMount,
    		GL,
    		w,
    		h,
    		d,
    		light,
    		sun,
    		from_hex,
    		orbitY
    	});

    	$$self.$inject_state = $$props => {
    		if ("w" in $$props) w = $$props.w;
    		if ("h" in $$props) $$invalidate(1, h = $$props.h);
    		if ("d" in $$props) d = $$props.d;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sun, h, light, from_hex];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    // wire-in query params
    // let user = ''
    // const URLSearchParams = window.URLSearchParams
    // if (typeof URLSearchParams !== undefined) {
    //   const urlParams = new URLSearchParams(window.location.search)
    //   const myParam = urlParams.get('user')
    //   if (myParam) {
    //     user = myParam
    //   }
    // }

    const app = new App({
      target: document.body
      // props: { user: user }
    });

    return app;

}());
