
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/ui/Palette.svelte generated by Svelte v3.49.0 */

    const file$b = "src/ui/Palette.svelte";

    function create_fragment$b(ctx) {
    	let div50;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let t4;
    	let div5;
    	let t5;
    	let div6;
    	let t6;
    	let div7;
    	let t7;
    	let div8;
    	let t8;
    	let div9;
    	let t9;
    	let div10;
    	let t10;
    	let div11;
    	let t11;
    	let div12;
    	let t12;
    	let div13;
    	let t13;
    	let div14;
    	let t14;
    	let div15;
    	let t15;
    	let div16;
    	let t16;
    	let div17;
    	let t17;
    	let div18;
    	let t18;
    	let div19;
    	let t19;
    	let div20;
    	let t20;
    	let div21;
    	let t21;
    	let div22;
    	let t22;
    	let div23;
    	let t23;
    	let div24;
    	let t24;
    	let div25;
    	let t25;
    	let div26;
    	let t26;
    	let div27;
    	let t27;
    	let div28;
    	let t28;
    	let div29;
    	let t29;
    	let div30;
    	let t30;
    	let div31;
    	let t31;
    	let div32;
    	let t32;
    	let div33;
    	let t33;
    	let div34;
    	let t34;
    	let div35;
    	let t35;
    	let div36;
    	let t36;
    	let div37;
    	let t37;
    	let div38;
    	let t38;
    	let div39;
    	let t39;
    	let div40;
    	let t40;
    	let div41;
    	let t41;
    	let div42;
    	let t42;
    	let div43;
    	let t43;
    	let div44;
    	let t44;
    	let div45;
    	let t45;
    	let div46;
    	let t46;
    	let div47;
    	let t47;
    	let div48;
    	let t48;
    	let div49;

    	const block = {
    		c: function create() {
    			div50 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			div5 = element("div");
    			t5 = space();
    			div6 = element("div");
    			t6 = space();
    			div7 = element("div");
    			t7 = space();
    			div8 = element("div");
    			t8 = space();
    			div9 = element("div");
    			t9 = space();
    			div10 = element("div");
    			t10 = space();
    			div11 = element("div");
    			t11 = space();
    			div12 = element("div");
    			t12 = space();
    			div13 = element("div");
    			t13 = space();
    			div14 = element("div");
    			t14 = space();
    			div15 = element("div");
    			t15 = space();
    			div16 = element("div");
    			t16 = space();
    			div17 = element("div");
    			t17 = space();
    			div18 = element("div");
    			t18 = space();
    			div19 = element("div");
    			t19 = space();
    			div20 = element("div");
    			t20 = space();
    			div21 = element("div");
    			t21 = space();
    			div22 = element("div");
    			t22 = space();
    			div23 = element("div");
    			t23 = space();
    			div24 = element("div");
    			t24 = space();
    			div25 = element("div");
    			t25 = space();
    			div26 = element("div");
    			t26 = space();
    			div27 = element("div");
    			t27 = space();
    			div28 = element("div");
    			t28 = space();
    			div29 = element("div");
    			t29 = space();
    			div30 = element("div");
    			t30 = space();
    			div31 = element("div");
    			t31 = space();
    			div32 = element("div");
    			t32 = space();
    			div33 = element("div");
    			t33 = space();
    			div34 = element("div");
    			t34 = space();
    			div35 = element("div");
    			t35 = space();
    			div36 = element("div");
    			t36 = space();
    			div37 = element("div");
    			t37 = space();
    			div38 = element("div");
    			t38 = space();
    			div39 = element("div");
    			t39 = space();
    			div40 = element("div");
    			t40 = space();
    			div41 = element("div");
    			t41 = space();
    			div42 = element("div");
    			t42 = space();
    			div43 = element("div");
    			t43 = space();
    			div44 = element("div");
    			t44 = space();
    			div45 = element("div");
    			t45 = space();
    			div46 = element("div");
    			t46 = space();
    			div47 = element("div");
    			t47 = space();
    			div48 = element("div");
    			t48 = space();
    			div49 = element("div");
    			set_style(div0, "background", "#FFFFFF");
    			add_location(div0, file$b, 1, 1, 32);
    			set_style(div1, "background", "#AAAAAA");
    			add_location(div1, file$b, 2, 1, 67);
    			set_style(div2, "background", "#888888");
    			add_location(div2, file$b, 3, 1, 102);
    			set_style(div3, "background", "#484848");
    			add_location(div3, file$b, 4, 1, 137);
    			set_style(div4, "background", "#000000");
    			add_location(div4, file$b, 5, 1, 172);
    			set_style(div5, "background", "#991609");
    			add_location(div5, file$b, 6, 1, 207);
    			set_style(div6, "background", "#DF250B");
    			add_location(div6, file$b, 7, 1, 242);
    			set_style(div7, "background", "#FF5610");
    			add_location(div7, file$b, 8, 1, 277);
    			set_style(div8, "background", "#FF832A");
    			add_location(div8, file$b, 9, 1, 312);
    			set_style(div9, "background", "#FFB885");
    			add_location(div9, file$b, 10, 1, 347);
    			set_style(div10, "background", "#936100");
    			add_location(div10, file$b, 11, 1, 382);
    			set_style(div11, "background", "#E29705");
    			add_location(div11, file$b, 12, 1, 417);
    			set_style(div12, "background", "#FFD223");
    			add_location(div12, file$b, 13, 1, 452);
    			set_style(div13, "background", "#FFF7AF");
    			add_location(div13, file$b, 14, 1, 487);
    			set_style(div14, "background", "#47561E");
    			add_location(div14, file$b, 15, 1, 522);
    			set_style(div15, "background", "#71892B");
    			add_location(div15, file$b, 16, 1, 557);
    			set_style(div16, "background", "#94BE1A");
    			add_location(div16, file$b, 17, 1, 592);
    			set_style(div17, "background", "#DCFF77");
    			add_location(div17, file$b, 18, 1, 627);
    			set_style(div18, "background", "#124B36");
    			add_location(div18, file$b, 19, 1, 662);
    			set_style(div19, "background", "#0F8158");
    			add_location(div19, file$b, 20, 1, 697);
    			set_style(div20, "background", "#03C07C");
    			add_location(div20, file$b, 21, 1, 732);
    			set_style(div21, "background", "#90FFCA");
    			add_location(div21, file$b, 22, 1, 767);
    			set_style(div22, "background", "#024851");
    			add_location(div22, file$b, 23, 1, 802);
    			set_style(div23, "background", "#0D7A89");
    			add_location(div23, file$b, 24, 1, 837);
    			set_style(div24, "background", "#01A6BD");
    			add_location(div24, file$b, 25, 1, 872);
    			set_style(div25, "background", "#34E7FF");
    			add_location(div25, file$b, 26, 1, 907);
    			set_style(div26, "background", "#013462");
    			add_location(div26, file$b, 27, 1, 942);
    			set_style(div27, "background", "#0D569A");
    			add_location(div27, file$b, 28, 1, 977);
    			set_style(div28, "background", "#066ECE");
    			add_location(div28, file$b, 29, 1, 1012);
    			set_style(div29, "background", "#4CA9FF");
    			add_location(div29, file$b, 30, 1, 1047);
    			set_style(div30, "background", "#181691");
    			add_location(div30, file$b, 31, 1, 1082);
    			set_style(div31, "background", "#2A25F5");
    			add_location(div31, file$b, 32, 1, 1117);
    			set_style(div32, "background", "#4E55FF");
    			add_location(div32, file$b, 33, 1, 1152);
    			set_style(div33, "background", "#9DB8FF");
    			add_location(div33, file$b, 34, 1, 1187);
    			set_style(div34, "background", "#58196B");
    			add_location(div34, file$b, 35, 1, 1222);
    			set_style(div35, "background", "#AC01E0");
    			add_location(div35, file$b, 36, 1, 1257);
    			set_style(div36, "background", "#C82EF7");
    			add_location(div36, file$b, 37, 1, 1292);
    			set_style(div37, "background", "#DC91FF");
    			add_location(div37, file$b, 38, 1, 1327);
    			set_style(div38, "background", "#650036");
    			add_location(div38, file$b, 39, 1, 1362);
    			set_style(div39, "background", "#B0114B");
    			add_location(div39, file$b, 40, 1, 1397);
    			set_style(div40, "background", "#EA3477");
    			add_location(div40, file$b, 41, 1, 1432);
    			set_style(div41, "background", "#FF95BC");
    			add_location(div41, file$b, 42, 1, 1467);
    			set_style(div42, "background", "#62071D");
    			add_location(div42, file$b, 43, 1, 1502);
    			set_style(div43, "background", "#9B0834");
    			add_location(div43, file$b, 44, 1, 1537);
    			set_style(div44, "background", "#CB003D");
    			add_location(div44, file$b, 45, 1, 1572);
    			set_style(div45, "background", "#FF7384");
    			add_location(div45, file$b, 46, 1, 1607);
    			set_style(div46, "background", "#49230A");
    			add_location(div46, file$b, 47, 1, 1642);
    			set_style(div47, "background", "#814A17");
    			add_location(div47, file$b, 48, 1, 1677);
    			set_style(div48, "background", "#D17A2B");
    			add_location(div48, file$b, 49, 1, 1712);
    			set_style(div49, "background", "#FFB470");
    			add_location(div49, file$b, 50, 1, 1747);
    			attr_dev(div50, "id", "palette");
    			attr_dev(div50, "class", "box");
    			add_location(div50, file$b, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div50, anchor);
    			append_dev(div50, div0);
    			append_dev(div50, t0);
    			append_dev(div50, div1);
    			append_dev(div50, t1);
    			append_dev(div50, div2);
    			append_dev(div50, t2);
    			append_dev(div50, div3);
    			append_dev(div50, t3);
    			append_dev(div50, div4);
    			append_dev(div50, t4);
    			append_dev(div50, div5);
    			append_dev(div50, t5);
    			append_dev(div50, div6);
    			append_dev(div50, t6);
    			append_dev(div50, div7);
    			append_dev(div50, t7);
    			append_dev(div50, div8);
    			append_dev(div50, t8);
    			append_dev(div50, div9);
    			append_dev(div50, t9);
    			append_dev(div50, div10);
    			append_dev(div50, t10);
    			append_dev(div50, div11);
    			append_dev(div50, t11);
    			append_dev(div50, div12);
    			append_dev(div50, t12);
    			append_dev(div50, div13);
    			append_dev(div50, t13);
    			append_dev(div50, div14);
    			append_dev(div50, t14);
    			append_dev(div50, div15);
    			append_dev(div50, t15);
    			append_dev(div50, div16);
    			append_dev(div50, t16);
    			append_dev(div50, div17);
    			append_dev(div50, t17);
    			append_dev(div50, div18);
    			append_dev(div50, t18);
    			append_dev(div50, div19);
    			append_dev(div50, t19);
    			append_dev(div50, div20);
    			append_dev(div50, t20);
    			append_dev(div50, div21);
    			append_dev(div50, t21);
    			append_dev(div50, div22);
    			append_dev(div50, t22);
    			append_dev(div50, div23);
    			append_dev(div50, t23);
    			append_dev(div50, div24);
    			append_dev(div50, t24);
    			append_dev(div50, div25);
    			append_dev(div50, t25);
    			append_dev(div50, div26);
    			append_dev(div50, t26);
    			append_dev(div50, div27);
    			append_dev(div50, t27);
    			append_dev(div50, div28);
    			append_dev(div50, t28);
    			append_dev(div50, div29);
    			append_dev(div50, t29);
    			append_dev(div50, div30);
    			append_dev(div50, t30);
    			append_dev(div50, div31);
    			append_dev(div50, t31);
    			append_dev(div50, div32);
    			append_dev(div50, t32);
    			append_dev(div50, div33);
    			append_dev(div50, t33);
    			append_dev(div50, div34);
    			append_dev(div50, t34);
    			append_dev(div50, div35);
    			append_dev(div50, t35);
    			append_dev(div50, div36);
    			append_dev(div50, t36);
    			append_dev(div50, div37);
    			append_dev(div50, t37);
    			append_dev(div50, div38);
    			append_dev(div50, t38);
    			append_dev(div50, div39);
    			append_dev(div50, t39);
    			append_dev(div50, div40);
    			append_dev(div50, t40);
    			append_dev(div50, div41);
    			append_dev(div50, t41);
    			append_dev(div50, div42);
    			append_dev(div50, t42);
    			append_dev(div50, div43);
    			append_dev(div50, t43);
    			append_dev(div50, div44);
    			append_dev(div50, t44);
    			append_dev(div50, div45);
    			append_dev(div50, t45);
    			append_dev(div50, div46);
    			append_dev(div50, t46);
    			append_dev(div50, div47);
    			append_dev(div50, t47);
    			append_dev(div50, div48);
    			append_dev(div50, t48);
    			append_dev(div50, div49);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div50);
    		}
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

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Palette', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Palette> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Palette extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Palette",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/ui/SwitchPlacement.svelte generated by Svelte v3.49.0 */

    const file$a = "src/ui/SwitchPlacement.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let button2;
    	let img2;
    	let img2_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			img0 = element("img");
    			t0 = space();
    			button1 = element("button");
    			img1 = element("img");
    			t1 = space();
    			button2 = element("button");
    			img2 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "./images/icons/exit.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "esc");
    			add_location(img0, file$a, 7, 63, 217);
    			attr_dev(button0, "id", "escOpen");
    			attr_dev(button0, "class", "icoButton ico");
    			add_location(button0, file$a, 7, 1, 155);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/on raycast.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "place at raycast");
    			add_location(img1, file$a, 8, 51, 323);
    			attr_dev(button1, "id", "placeAtRaycast");
    			attr_dev(button1, "class", "icoButton ico");
    			add_location(button1, file$a, 8, 1, 273);
    			if (!src_url_equal(img2.src, img2_src_value = "./images/icons/in camera.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "place in camera");
    			add_location(img2, file$a, 9, 50, 447);
    			attr_dev(button2, "id", "placeInCamera");
    			attr_dev(button2, "class", "icoButton ico");
    			add_location(button2, file$a, 9, 1, 398);
    			attr_dev(div, "id", "switchPlacement");
    			attr_dev(div, "class", "box");
    			add_location(div, file$a, 6, 0, 115);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, img0);
    			append_dev(div, t0);
    			append_dev(div, button1);
    			append_dev(button1, img1);
    			append_dev(div, t1);
    			append_dev(div, button2);
    			append_dev(button2, img2);

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", escOpen, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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

    function escOpen() {
    	esc.style.display = esc.style.display == "flex" ? "none" : "flex";
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SwitchPlacement', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SwitchPlacement> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ escOpen });
    	return [];
    }

    class SwitchPlacement extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SwitchPlacement",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/ui/Coordinates.svelte generated by Svelte v3.49.0 */

    const file$9 = "src/ui/Coordinates.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "x: 0, y: 0, z:0";
    			attr_dev(div0, "id", "coords");
    			add_location(div0, file$9, 1, 1, 36);
    			attr_dev(div1, "id", "coordinates");
    			attr_dev(div1, "class", "box");
    			add_location(div1, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
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

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Coordinates', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Coordinates> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Coordinates extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Coordinates",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/ui/Sign.svelte generated by Svelte v3.49.0 */

    const file$8 = "src/ui/Sign.svelte";

    function create_fragment$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "This is a sign! or a cubic sign?\n─────────────────────────────────────────────────────\nthe quick brown fox jumps over the lazy dog\nThe quick brown fox jumps over the lazy dog.\nTHE QUICK BROWN FOX JUMPS OVER THE LAZY DOG\nTHE QUICK BROWN FOX JUMPS OVER THE LAZY DOG!!!\n                 .-˙-.\n              .-˙ ˙.˙ ˙-.        adobe photoshop\n           .-˙ .˙.˙.˙.˙. ˙-.          1999\n        .-˙.˙.˙.˙.˙.˙.˙.˙.˙.˙-.\n        |-. ˙.˙.˙.˙.˙.˙.˙.˙ .-|    𝗺cdonalds はいー \n        |  ˙-.˙.˙.˙.˙.˙.˙.-˙  |           ( ◕͡  ͜ʖ◕͡ )\n        |     ˙-. ˙.˙ .-˙     |       🥚    🥚egg🥚🥚\n        |       adocubes      |         🥚🥚  🥚 🥚\n    made in Three.js & Svelte with ❤    🥚 🥚 🥚\n        |          |          |               🐔\n        ˙-.        |        .-˙        𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆\n           ˙-.     |     .-˙             ─  ─  ─  ─\n              ˙-.  |  .-˙     md2      𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖\n                 ˙-|-˙";
    			attr_dev(div, "id", "sign");
    			attr_dev(div, "class", "box center");
    			set_style(div, "white-space", "pre");
    			add_location(div, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
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

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sign', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sign> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Sign extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sign",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/ui/Chat.svelte generated by Svelte v3.49.0 */

    const file$7 = "src/ui/Chat.svelte";

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let input;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			input = element("input");
    			attr_dev(div0, "id", "messages");
    			add_location(div0, file$7, 1, 1, 29);
    			attr_dev(input, "id", "inputChat");
    			attr_dev(input, "type", "text");
    			add_location(input, file$7, 2, 1, 51);
    			attr_dev(div1, "id", "chat");
    			attr_dev(div1, "class", "box");
    			add_location(div1, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t);
    			append_dev(div1, input);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
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

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chat', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chat> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Chat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chat",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/ui/Playerlist.svelte generated by Svelte v3.49.0 */

    const file$6 = "src/ui/Playerlist.svelte";

    function create_fragment$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "playerlist hereeeeee";
    			attr_dev(div, "id", "playerlist");
    			attr_dev(div, "class", "box");
    			add_location(div, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
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

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Playerlist', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Playerlist> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Playerlist extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Playerlist",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/ui/misc/Esc.svelte generated by Svelte v3.49.0 */

    const file$5 = "src/ui/misc/Esc.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div1;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let br;
    	let t6;
    	let div0;
    	let a0;
    	let t8;
    	let a1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Return";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Settings";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Credits";
    			t5 = space();
    			br = element("br");
    			t6 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Source code";
    			t8 = text(" • ");
    			a1 = element("a");
    			a1.textContent = "Discord server";
    			attr_dev(button0, "id", "escReturn");
    			attr_dev(button0, "class", "escButton");
    			add_location(button0, file$5, 26, 2, 620);
    			attr_dev(button1, "id", "escSettings");
    			attr_dev(button1, "class", "escButton");
    			add_location(button1, file$5, 27, 2, 700);
    			attr_dev(button2, "id", "escCredits");
    			attr_dev(button2, "class", "escButton");
    			add_location(button2, file$5, 28, 2, 786);
    			add_location(br, file$5, 29, 2, 869);
    			attr_dev(a0, "href", "https://github.com/ado1928/ado-cubes");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$5, 31, 3, 936);
    			attr_dev(a1, "href", "https://discord.gg/rNMTeADfnc");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$5, 31, 118, 1051);
    			set_style(div0, "display", "flex");
    			set_style(div0, "flex-direction", "row");
    			set_style(div0, "width", "auto");
    			add_location(div0, file$5, 30, 2, 876);
    			attr_dev(div1, "id", "escMenu");
    			attr_dev(div1, "class", "box center");
    			add_location(div1, file$5, 25, 1, 580);
    			attr_dev(div2, "id", "esc");
    			add_location(div2, file$5, 24, 0, 564);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t1);
    			append_dev(div1, button1);
    			append_dev(div1, t3);
    			append_dev(div1, button2);
    			append_dev(div1, t5);
    			append_dev(div1, br);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t8);
    			append_dev(div0, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", escReturn, false, false, false),
    					listen_dev(button1, "click", escSettings, false, false, false),
    					listen_dev(button2, "click", escCredits, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
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

    function escReturn() {
    	esc.style.display = "none";
    }

    function escSettings() {
    	esc.style.display = "none";
    	settings.style.display = "block";
    }

    function escCredits() {
    	esc.style.display = "none";
    	credits.style.display = "block";
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Esc', slots, []);

    	document.onkeydown = event => {
    		if (event.key === "Escape" && document.activeElement.tagName !== "INPUT") {
    			esc.style.display = esc.style.display == "block" ? "none" : "block";
    			credits.style.display = "none";
    			settings.style.display = "none";
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Esc> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ escReturn, escSettings, escCredits });
    	return [];
    }

    class Esc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Esc",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/ui/misc/Window.svelte generated by Svelte v3.49.0 */

    const file$4 = "src/ui/misc/Window.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let h2;
    	let t1;
    	let t2;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			img0 = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			button1 = element("button");
    			img1 = element("img");
    			t3 = space();
    			if (default_slot) default_slot.c();
    			if (!src_url_equal(img0.src, img0_src_value = "./images/icons/back.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "<=");
    			add_location(img0, file$4, 16, 54, 416);
    			attr_dev(button0, "class", "icoButton icoNav");
    			add_location(button0, file$4, 16, 2, 364);
    			set_style(h2, "margin", "0");
    			add_location(h2, file$4, 17, 2, 472);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/exit.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "X");
    			add_location(img1, file$4, 18, 54, 561);
    			attr_dev(button1, "class", "icoButton icoNav");
    			add_location(button1, file$4, 18, 2, 509);
    			set_style(div0, "display", "flex");
    			set_style(div0, "justify-content", "space-between");
    			set_style(div0, "align-items", "center");
    			set_style(div0, "padding", "4px 4px");
    			set_style(div0, "margin-bottom", "12px");
    			add_location(div0, file$4, 15, 1, 251);
    			attr_dev(div1, "id", /*id*/ ctx[0]);
    			attr_dev(div1, "class", "box win center");
    			add_location(div1, file$4, 14, 0, 216);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(button0, img0);
    			append_dev(div0, t0);
    			append_dev(div0, h2);
    			append_dev(h2, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(button1, img1);
    			append_dev(div1, t3);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", escBack, false, false, false),
    					listen_dev(button1, "click", escExit, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*id*/ 1) {
    				attr_dev(div1, "id", /*id*/ ctx[0]);
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
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
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

    function escBack() {
    	escExit();
    	esc.style.display = "flex";
    }

    function escExit() {
    	settings.style.display = "none";
    	credits.style.display = "none";
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Window', slots, ['default']);
    	let { id } = $$props;
    	let { title } = $$props;
    	const writable_props = ['id', 'title'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Window> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ id, title, escBack, escExit });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, title, $$scope, slots];
    }

    class Window extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { id: 0, title: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Window",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<Window> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<Window> was created without expected prop 'title'");
    		}
    	}

    	get id() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ui/win/Welcome.svelte generated by Svelte v3.49.0 */

    const file$3 = "src/ui/win/Welcome.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let br0;
    	let br1;
    	let br2;
    	let t1;
    	let input;
    	let br3;
    	let t2;
    	let p0;
    	let t3;
    	let br4;
    	let t4;
    	let br5;
    	let br6;
    	let t5;
    	let strong0;
    	let t7;
    	let br7;
    	let br8;
    	let t8;
    	let strong1;
    	let t10;
    	let br9;
    	let t11;
    	let br10;
    	let t12;
    	let p1;
    	let br11;
    	let t13;
    	let t14;
    	let div1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			br0 = element("br");
    			br1 = element("br");
    			br2 = element("br");
    			t1 = text("\n\tNickname: ");
    			input = element("input");
    			br3 = element("br");
    			t2 = space();
    			p0 = element("p");
    			t3 = text("It's seems you have disabled verification.");
    			br4 = element("br");
    			t4 = text("Please note that you won't be able to connect to the server.");
    			br5 = element("br");
    			br6 = element("br");
    			t5 = space();
    			strong0 = element("strong");
    			strong0.textContent = "important: ";
    			t7 = text("Check controls by pressing Escape, click on Settings, and look at Input category.");
    			br7 = element("br");
    			br8 = element("br");
    			t8 = space();
    			strong1 = element("strong");
    			strong1.textContent = "note: ";
    			t10 = text("iocaptcha at this time is a bit iffy.");
    			br9 = element("br");
    			t11 = text("\n\tIf a captcha is a too hard for you, refresh the page.");
    			br10 = element("br");
    			t12 = space();
    			p1 = element("p");
    			br11 = element("br");
    			t13 = text("Please take the captcha! If you can't see it, please refresh page.");
    			t14 = space();
    			div1 = element("div");
    			attr_dev(img, "id", "welcomeLogo");
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "style", /*style*/ ctx[1]);
    			add_location(img, file$3, 18, 2, 646);
    			add_location(div0, file$3, 17, 1, 638);
    			add_location(br0, file$3, 20, 1, 692);
    			add_location(br1, file$3, 20, 5, 696);
    			add_location(br2, file$3, 20, 9, 700);
    			attr_dev(input, "id", "inputUsername");
    			attr_dev(input, "type", "text");
    			add_location(input, file$3, 21, 11, 716);
    			add_location(br3, file$3, 21, 49, 754);
    			add_location(br4, file$3, 22, 88, 847);
    			add_location(br5, file$3, 22, 152, 911);
    			attr_dev(p0, "id", "noNeedToVerify");
    			set_style(p0, "display", "none");
    			add_location(p0, file$3, 22, 1, 760);
    			add_location(br6, file$3, 22, 160, 919);
    			add_location(strong0, file$3, 24, 1, 926);
    			add_location(br7, file$3, 24, 110, 1035);
    			add_location(br8, file$3, 24, 114, 1039);
    			add_location(strong1, file$3, 26, 1, 1046);
    			add_location(br9, file$3, 26, 61, 1106);
    			add_location(br10, file$3, 27, 54, 1165);
    			add_location(br11, file$3, 29, 45, 1216);
    			attr_dev(p1, "id", "captchaPlease");
    			set_style(p1, "display", "none");
    			add_location(p1, file$3, 29, 1, 1172);
    			attr_dev(div1, "class", "io-captcha");
    			attr_dev(div1, "data-pubkey", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO");
    			attr_dev(div1, "data-theme", "dark");
    			attr_dev(div1, "data-scale", "1.0");
    			attr_dev(div1, "data-font", "mono");
    			attr_dev(div1, "data-callback-solve", "solve");
    			attr_dev(div1, "data-widgetid", "iocaptcha");
    			add_location(div1, file$3, 30, 1, 1292);
    			attr_dev(div2, "id", "welcome");
    			attr_dev(div2, "class", "box center");
    			set_style(div2, "top", "62%");
    			add_location(div2, file$3, 16, 0, 583);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, br0);
    			append_dev(div2, br1);
    			append_dev(div2, br2);
    			append_dev(div2, t1);
    			append_dev(div2, input);
    			append_dev(div2, br3);
    			append_dev(div2, t2);
    			append_dev(div2, p0);
    			append_dev(p0, t3);
    			append_dev(p0, br4);
    			append_dev(p0, t4);
    			append_dev(p0, br5);
    			append_dev(div2, br6);
    			append_dev(div2, t5);
    			append_dev(div2, strong0);
    			append_dev(div2, t7);
    			append_dev(div2, br7);
    			append_dev(div2, br8);
    			append_dev(div2, t8);
    			append_dev(div2, strong1);
    			append_dev(div2, t10);
    			append_dev(div2, br9);
    			append_dev(div2, t11);
    			append_dev(div2, br10);
    			append_dev(div2, t12);
    			append_dev(div2, p1);
    			append_dev(p1, br11);
    			append_dev(p1, t13);
    			append_dev(div2, t14);
    			append_dev(div2, div1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Welcome', slots, []);
    	let src = "./images/logo/adocubes.svg";
    	let style = "position:absolute;transform:translate(-50%, -174px);left:50%;pointer-events:none";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Welcome> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ src, style });

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    		if ('style' in $$props) $$invalidate(1, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, style];
    }

    class Welcome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/ui/win/Settings.svelte generated by Svelte v3.49.0 */
    const file$2 = "src/ui/win/Settings.svelte";

    function create_fragment$2(ctx) {
    	let div29;
    	let strong0;
    	let t1;
    	let br0;
    	let br1;
    	let br2;
    	let t2;
    	let h20;
    	let t4;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t5;
    	let br3;
    	let t6;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let br4;
    	let t8;
    	let button0;
    	let t10;
    	let input0;
    	let t11;
    	let h21;
    	let t13;
    	let div1;
    	let img2;
    	let img2_src_value;
    	let t14;
    	let select0;
    	let option0;
    	let option1;
    	let t17;
    	let details4;
    	let summary0;
    	let strong1;
    	let t19;
    	let div17;
    	let details0;
    	let summary1;
    	let strong2;
    	let t21;
    	let img3;
    	let img3_src_value;
    	let t22;
    	let select1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let t28;
    	let div2;
    	let t29;
    	let input1;
    	let t30;
    	let div3;
    	let t31;
    	let input2;
    	let t32;
    	let details1;
    	let summary2;
    	let strong3;
    	let t34;
    	let div4;
    	let t35;
    	let input3;
    	let t36;
    	let div5;
    	let t37;
    	let input4;
    	let t38;
    	let details2;
    	let summary3;
    	let strong4;
    	let t40;
    	let div6;
    	let t41;
    	let input5;
    	let t42;
    	let div7;
    	let t43;
    	let input6;
    	let t44;
    	let div8;
    	let t45;
    	let input7;
    	let t46;
    	let div9;
    	let t47;
    	let input8;
    	let t48;
    	let div10;
    	let t49;
    	let input9;
    	let t50;
    	let div11;
    	let t51;
    	let input10;
    	let t52;
    	let details3;
    	let summary4;
    	let strong5;
    	let t54;
    	let div12;
    	let t55;
    	let input11;
    	let t56;
    	let div13;
    	let t57;
    	let input12;
    	let t58;
    	let div14;
    	let t59;
    	let input13;
    	let t60;
    	let div15;
    	let t61;
    	let input14;
    	let t62;
    	let div16;
    	let t64;
    	let details5;
    	let summary5;
    	let strong6;
    	let t66;
    	let div18;
    	let img4;
    	let img4_src_value;
    	let t67;
    	let t68;
    	let t69;
    	let input15;
    	let t70;
    	let div19;
    	let img5;
    	let img5_src_value;
    	let t71;
    	let t72;
    	let t73;
    	let input16;
    	let t74;
    	let div20;
    	let img6;
    	let img6_src_value;
    	let t75;
    	let t76;
    	let t77;
    	let input17;
    	let t78;
    	let div21;
    	let img7;
    	let img7_src_value;
    	let t79;
    	let input18;
    	let t80;
    	let div22;
    	let t81;
    	let input19;
    	let t82;
    	let div23;
    	let t83;
    	let input20;
    	let t84;
    	let details6;
    	let summary6;
    	let strong7;
    	let t86;
    	let div24;
    	let img8;
    	let img8_src_value;
    	let t87;
    	let input21;
    	let t88;
    	let div25;
    	let t89;
    	let input22;
    	let t90;
    	let div26;
    	let t91;
    	let input23;
    	let t92;
    	let div27;
    	let img9;
    	let img9_src_value;
    	let t93;
    	let input24;
    	let t94;
    	let div28;
    	let img10;
    	let img10_src_value;
    	let t95;
    	let input25;
    	let t96;
    	let button1;
    	let t98;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div29 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "note: ";
    			t1 = text("Saving settings has been entirely removed for the time being.\n\n\t");
    			br0 = element("br");
    			br1 = element("br");
    			br2 = element("br");
    			t2 = space();
    			h20 = element("h2");
    			h20.textContent = "legend";
    			t4 = space();
    			div0 = element("div");
    			img0 = element("img");
    			t5 = text(" - Not functional");
    			br3 = element("br");
    			t6 = space();
    			img1 = element("img");
    			t7 = text(" - Requires refresh");
    			br4 = element("br");
    			t8 = space();
    			button0 = element("button");
    			button0.textContent = "Click this button, and press any key";
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			h21 = element("h2");
    			h21.textContent = "general";
    			t13 = space();
    			div1 = element("div");
    			img2 = element("img");
    			t14 = text(" Language\n\t\t");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "English";
    			option1 = element("option");
    			option1.textContent = "Only English.";
    			t17 = space();
    			details4 = element("details");
    			summary0 = element("summary");
    			strong1 = element("strong");
    			strong1.textContent = "input";
    			t19 = space();
    			div17 = element("div");
    			details0 = element("details");
    			summary1 = element("summary");
    			strong2 = element("strong");
    			strong2.textContent = "movement";
    			t21 = space();
    			img3 = element("img");
    			t22 = text(" Movement method\n\t\t\t\t");
    			select1 = element("select");
    			option2 = element("option");
    			option2.textContent = "WASD";
    			option3 = element("option");
    			option3.textContent = "Arrows";
    			option4 = element("option");
    			option4.textContent = "Both";
    			option5 = element("option");
    			option5.textContent = "Custom";
    			option6 = element("option");
    			option6.textContent = "Custom with secondary";
    			t28 = space();
    			div2 = element("div");
    			t29 = text("Move up ");
    			input1 = element("input");
    			t30 = space();
    			div3 = element("div");
    			t31 = text("Move down ");
    			input2 = element("input");
    			t32 = space();
    			details1 = element("details");
    			summary2 = element("summary");
    			strong3 = element("strong");
    			strong3.textContent = "cube placing";
    			t34 = space();
    			div4 = element("div");
    			t35 = text("Place cubes ");
    			input3 = element("input");
    			t36 = space();
    			div5 = element("div");
    			t37 = text("Remove cubes ");
    			input4 = element("input");
    			t38 = space();
    			details2 = element("details");
    			summary3 = element("summary");
    			strong4 = element("strong");
    			strong4.textContent = "camera";
    			t40 = space();
    			div6 = element("div");
    			t41 = text("Increase camera speed ");
    			input5 = element("input");
    			t42 = space();
    			div7 = element("div");
    			t43 = text("decrease camera speed ");
    			input6 = element("input");
    			t44 = space();
    			div8 = element("div");
    			t45 = text("Reset camera speed ");
    			input7 = element("input");
    			t46 = space();
    			div9 = element("div");
    			t47 = text("Increase camera zoom ");
    			input8 = element("input");
    			t48 = space();
    			div10 = element("div");
    			t49 = text("Decrease camera zoom ");
    			input9 = element("input");
    			t50 = space();
    			div11 = element("div");
    			t51 = text("Reset camera zoom ");
    			input10 = element("input");
    			t52 = space();
    			details3 = element("details");
    			summary4 = element("summary");
    			strong5 = element("strong");
    			strong5.textContent = "other";
    			t54 = space();
    			div12 = element("div");
    			t55 = text("Toggle grid ");
    			input11 = element("input");
    			t56 = space();
    			div13 = element("div");
    			t57 = text("Palette row scroll ");
    			input12 = element("input");
    			t58 = space();
    			div14 = element("div");
    			t59 = text("Settings shortcut ");
    			input13 = element("input");
    			t60 = space();
    			div15 = element("div");
    			t61 = text("Disable mouse place and remove ");
    			input14 = element("input");
    			t62 = space();
    			div16 = element("div");
    			div16.textContent = "Not entirely sure what to put here for mobile rn.";
    			t64 = space();
    			details5 = element("details");
    			summary5 = element("summary");
    			strong6 = element("strong");
    			strong6.textContent = "audio";
    			t66 = space();
    			div18 = element("div");
    			img4 = element("img");
    			t67 = text(" Music ");
    			t68 = text(/*audioMusicVolume*/ ctx[0]);
    			t69 = space();
    			input15 = element("input");
    			t70 = space();
    			div19 = element("div");
    			img5 = element("img");
    			t71 = text(" SFX ");
    			t72 = text(/*audioSfxVolume*/ ctx[1]);
    			t73 = space();
    			input16 = element("input");
    			t74 = space();
    			div20 = element("div");
    			img6 = element("img");
    			t75 = text(" UI ");
    			t76 = text(/*audioUiVolume*/ ctx[2]);
    			t77 = space();
    			input17 = element("input");
    			t78 = space();
    			div21 = element("div");
    			img7 = element("img");
    			t79 = text(" Enable music ");
    			input18 = element("input");
    			t80 = space();
    			div22 = element("div");
    			t81 = text("Disable place and remove sounds ");
    			input19 = element("input");
    			t82 = space();
    			div23 = element("div");
    			t83 = text("Disable UI sounds ");
    			input20 = element("input");
    			t84 = space();
    			details6 = element("details");
    			summary6 = element("summary");
    			strong7 = element("strong");
    			strong7.textContent = "appearance";
    			t86 = space();
    			div24 = element("div");
    			img8 = element("img");
    			t87 = text(" Enable random logos in welcome ");
    			input21 = element("input");
    			t88 = space();
    			div25 = element("div");
    			t89 = text("Chat width ");
    			input22 = element("input");
    			t90 = space();
    			div26 = element("div");
    			t91 = text("Chat max height ");
    			input23 = element("input");
    			t92 = space();
    			div27 = element("div");
    			img9 = element("img");
    			t93 = text(" Disable background blur ");
    			input24 = element("input");
    			t94 = space();
    			div28 = element("div");
    			img10 = element("img");
    			t95 = text(" Disable text shadows ");
    			input25 = element("input");
    			t96 = space();
    			button1 = element("button");
    			button1.textContent = "Apply";
    			t98 = space();
    			button2 = element("button");
    			button2.textContent = "Default settings";
    			add_location(strong0, file$2, 32, 1, 1028);
    			add_location(br0, file$2, 34, 1, 1115);
    			add_location(br1, file$2, 34, 5, 1119);
    			add_location(br2, file$2, 34, 9, 1123);
    			set_style(h20, "margin", "0");
    			add_location(h20, file$2, 36, 1, 1130);
    			if (!src_url_equal(img0.src, img0_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$2, 38, 2, 1196);
    			add_location(br3, file$2, 38, 44, 1238);
    			if (!src_url_equal(img1.src, img1_src_value = /*refresh*/ ctx[4])) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 39, 2, 1245);
    			add_location(br4, file$2, 39, 40, 1283);
    			attr_dev(button0, "id", "notsure");
    			add_location(button0, file$2, 40, 2, 1290);
    			attr_dev(input0, "id", "surenot");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$2, 41, 2, 1359);
    			attr_dev(div0, "class", "settingsSection");
    			add_location(div0, file$2, 37, 1, 1164);
    			add_location(h21, file$2, 46, 1, 1405);
    			if (!src_url_equal(img2.src, img2_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img2, "src", img2_src_value);
    			add_location(img2, file$2, 47, 30, 1452);
    			option0.__value = "english";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 49, 3, 1522);
    			option1.__value = "onlyEnglish";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 50, 3, 1566);
    			attr_dev(select0, "id", "generalLanguage");
    			add_location(select0, file$2, 48, 2, 1489);
    			attr_dev(div1, "class", "settingsSection");
    			add_location(div1, file$2, 47, 1, 1423);
    			add_location(strong1, file$2, 55, 11, 1660);
    			add_location(summary0, file$2, 55, 2, 1651);
    			add_location(strong2, file$2, 58, 13, 1769);
    			add_location(summary1, file$2, 58, 4, 1760);
    			if (!src_url_equal(img3.src, img3_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img3, "src", img3_src_value);
    			add_location(img3, file$2, 59, 4, 1809);
    			option2.__value = "wasd";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 61, 5, 1901);
    			option3.__value = "arrow";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 62, 5, 1941);
    			option4.__value = "both";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 63, 5, 1984);
    			option5.__value = "custom";
    			option5.value = option5.__value;
    			add_location(option5, file$2, 64, 5, 2024);
    			option6.__value = "customsecondary";
    			option6.value = option6.__value;
    			add_location(option6, file$2, 65, 5, 2068);
    			attr_dev(select1, "id", "inputMovement");
    			add_location(select1, file$2, 60, 4, 1855);
    			attr_dev(input1, "id", "inputMoveUp");
    			attr_dev(input1, "type", "text");
    			input1.value = "Space";
    			add_location(input1, file$2, 79, 17, 2787);
    			add_location(div2, file$2, 79, 4, 2774);
    			attr_dev(input2, "id", "inputMoveDown");
    			attr_dev(input2, "type", "text");
    			input2.value = "ShiftLeft";
    			add_location(input2, file$2, 80, 19, 2863);
    			add_location(div3, file$2, 80, 4, 2848);
    			add_location(details0, file$2, 57, 3, 1746);
    			add_location(strong3, file$2, 83, 13, 2966);
    			add_location(summary2, file$2, 83, 4, 2957);
    			attr_dev(input3, "id", "inputPlaceCubes");
    			attr_dev(input3, "type", "text");
    			input3.value = "KeyX";
    			add_location(input3, file$2, 84, 21, 3027);
    			add_location(div4, file$2, 84, 4, 3010);
    			attr_dev(input4, "id", "inputRemoveCubes");
    			attr_dev(input4, "type", "text");
    			input4.value = "KeyC";
    			add_location(input4, file$2, 85, 22, 3109);
    			add_location(div5, file$2, 85, 4, 3091);
    			add_location(details1, file$2, 82, 3, 2943);
    			add_location(strong4, file$2, 88, 13, 3210);
    			add_location(summary3, file$2, 88, 4, 3201);
    			attr_dev(input5, "id", "inputIncreaseCameraSpeed");
    			attr_dev(input5, "type", "text");
    			input5.value = "BracketRight";
    			add_location(input5, file$2, 89, 31, 3275);
    			add_location(div6, file$2, 89, 4, 3248);
    			attr_dev(input6, "id", "inputDecreaseCameraSpeed");
    			attr_dev(input6, "type", "text");
    			input6.value = "BracketLeft";
    			add_location(input6, file$2, 90, 31, 3383);
    			add_location(div7, file$2, 90, 4, 3356);
    			attr_dev(input7, "id", "inputResetCameraSpeed");
    			attr_dev(input7, "type", "text");
    			input7.value = "Backslash";
    			add_location(input7, file$2, 91, 28, 3487);
    			add_location(div8, file$2, 91, 4, 3463);
    			attr_dev(input8, "id", "inputIncreaseCameraZoom");
    			attr_dev(input8, "type", "text");
    			input8.value = "Equal";
    			add_location(input8, file$2, 92, 30, 3588);
    			add_location(div9, file$2, 92, 4, 3562);
    			attr_dev(input9, "id", "inputDecreaseCameraZoom");
    			attr_dev(input9, "type", "text");
    			input9.value = "Minus";
    			add_location(input9, file$2, 93, 30, 3687);
    			add_location(div10, file$2, 93, 4, 3661);
    			attr_dev(input10, "id", "inputResetCameraZoom");
    			attr_dev(input10, "type", "text");
    			input10.value = "Quote";
    			add_location(input10, file$2, 94, 27, 3783);
    			add_location(div11, file$2, 94, 4, 3760);
    			add_location(details2, file$2, 87, 3, 3187);
    			add_location(strong5, file$2, 97, 13, 3889);
    			add_location(summary4, file$2, 97, 4, 3880);
    			attr_dev(input11, "id", "inputToggleGrid");
    			attr_dev(input11, "type", "text");
    			input11.value = "KeyG";
    			add_location(input11, file$2, 98, 21, 3943);
    			add_location(div12, file$2, 98, 4, 3926);
    			attr_dev(input12, "id", "inputPaletteRowScroll");
    			attr_dev(input12, "type", "text");
    			input12.value = "AltLeft";
    			add_location(input12, file$2, 99, 28, 4031);
    			add_location(div13, file$2, 99, 4, 4007);
    			attr_dev(input13, "id", "inputSettingsShortcut");
    			attr_dev(input13, "type", "text");
    			input13.value = "KeyL";
    			add_location(input13, file$2, 100, 27, 4127);
    			add_location(div14, file$2, 100, 4, 4104);
    			attr_dev(input14, "id", "inputDisablePR");
    			attr_dev(input14, "type", "checkbox");
    			add_location(input14, file$2, 101, 40, 4233);
    			add_location(div15, file$2, 101, 4, 4197);
    			add_location(details3, file$2, 96, 3, 3866);
    			attr_dev(div16, "id", "inputMobile");
    			attr_dev(div16, "class", "settingsSection");
    			add_location(div16, file$2, 103, 2, 4299);
    			attr_dev(div17, "id", "inputDesktop");
    			attr_dev(div17, "class", "settingsSection");
    			add_location(div17, file$2, 56, 2, 1695);
    			add_location(details4, file$2, 54, 1, 1639);
    			add_location(strong6, file$2, 107, 11, 4436);
    			add_location(summary5, file$2, 107, 2, 4427);
    			if (!src_url_equal(img4.src, img4_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img4, "src", img4_src_value);
    			add_location(img4, file$2, 108, 7, 4476);
    			attr_dev(input15, "id", "audioMusicVolume");
    			attr_dev(input15, "class", "slider");
    			attr_dev(input15, "type", "range");
    			add_location(input15, file$2, 108, 58, 4527);
    			add_location(div18, file$2, 108, 2, 4471);
    			if (!src_url_equal(img5.src, img5_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img5, "src", img5_src_value);
    			add_location(img5, file$2, 109, 7, 4628);
    			attr_dev(input16, "id", "audioSfxVolume");
    			attr_dev(input16, "class", "slider");
    			attr_dev(input16, "type", "range");
    			add_location(input16, file$2, 109, 54, 4675);
    			add_location(div19, file$2, 109, 2, 4623);
    			if (!src_url_equal(img6.src, img6_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img6, "src", img6_src_value);
    			add_location(img6, file$2, 110, 7, 4772);
    			attr_dev(input17, "id", "audioUiVolume");
    			attr_dev(input17, "class", "slider");
    			attr_dev(input17, "type", "range");
    			add_location(input17, file$2, 110, 52, 4817);
    			add_location(div20, file$2, 110, 2, 4767);
    			if (!src_url_equal(img7.src, img7_src_value = /*refresh*/ ctx[4])) attr_dev(img7, "src", img7_src_value);
    			add_location(img7, file$2, 111, 7, 4912);
    			attr_dev(input18, "id", "audioEnableMusic");
    			attr_dev(input18, "type", "checkbox");
    			add_location(input18, file$2, 111, 40, 4945);
    			add_location(div21, file$2, 111, 2, 4907);
    			attr_dev(input19, "id", "audioDisablePR");
    			attr_dev(input19, "type", "checkbox");
    			add_location(input19, file$2, 112, 39, 5036);
    			add_location(div22, file$2, 112, 2, 4999);
    			attr_dev(input20, "id", "audioDisableUI");
    			attr_dev(input20, "type", "checkbox");
    			add_location(input20, file$2, 113, 25, 5111);
    			add_location(div23, file$2, 113, 2, 5088);
    			add_location(details5, file$2, 106, 1, 4415);
    			add_location(strong7, file$2, 117, 11, 5196);
    			add_location(summary6, file$2, 117, 2, 5187);
    			if (!src_url_equal(img8.src, img8_src_value = /*refresh*/ ctx[4])) attr_dev(img8, "src", img8_src_value);
    			add_location(img8, file$2, 118, 7, 5241);
    			attr_dev(input21, "id", "miscEnableRandomLogos");
    			attr_dev(input21, "type", "checkbox");
    			add_location(input21, file$2, 118, 58, 5292);
    			add_location(div24, file$2, 118, 2, 5236);
    			attr_dev(input22, "id", "themeChatWidth");
    			attr_dev(input22, "type", "text");
    			input22.value = "440px";
    			add_location(input22, file$2, 119, 18, 5367);
    			add_location(div25, file$2, 119, 2, 5351);
    			attr_dev(input23, "id", "themeChatMaxHeight");
    			attr_dev(input23, "type", "text");
    			input23.value = "480px";
    			add_location(input23, file$2, 120, 23, 5450);
    			add_location(div26, file$2, 120, 2, 5429);
    			if (!src_url_equal(img9.src, img9_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img9, "src", img9_src_value);
    			add_location(img9, file$2, 121, 7, 5521);
    			attr_dev(input24, "id", "themeDisableBgBlur");
    			attr_dev(input24, "type", "checkbox");
    			add_location(input24, file$2, 121, 57, 5571);
    			add_location(div27, file$2, 121, 2, 5516);
    			if (!src_url_equal(img10.src, img10_src_value = /*nonFunctional*/ ctx[3])) attr_dev(img10, "src", img10_src_value);
    			add_location(img10, file$2, 122, 7, 5632);
    			attr_dev(input25, "id", "themeDisableTextShadows");
    			attr_dev(input25, "type", "checkbox");
    			add_location(input25, file$2, 122, 54, 5679);
    			add_location(div28, file$2, 122, 2, 5627);
    			add_location(details6, file$2, 116, 1, 5175);
    			set_style(div29, "overflow-y", "scroll");
    			set_style(div29, "height", "400px");
    			add_location(div29, file$2, 31, 0, 982);
    			attr_dev(button1, "id", "applySettings");
    			add_location(button1, file$2, 125, 0, 5757);
    			add_location(button2, file$2, 125, 67, 5824);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div29, anchor);
    			append_dev(div29, strong0);
    			append_dev(div29, t1);
    			append_dev(div29, br0);
    			append_dev(div29, br1);
    			append_dev(div29, br2);
    			append_dev(div29, t2);
    			append_dev(div29, h20);
    			append_dev(div29, t4);
    			append_dev(div29, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t5);
    			append_dev(div0, br3);
    			append_dev(div0, t6);
    			append_dev(div0, img1);
    			append_dev(div0, t7);
    			append_dev(div0, br4);
    			append_dev(div0, t8);
    			append_dev(div0, button0);
    			append_dev(div0, t10);
    			append_dev(div0, input0);
    			append_dev(div29, t11);
    			append_dev(div29, h21);
    			append_dev(div29, t13);
    			append_dev(div29, div1);
    			append_dev(div1, img2);
    			append_dev(div1, t14);
    			append_dev(div1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(div29, t17);
    			append_dev(div29, details4);
    			append_dev(details4, summary0);
    			append_dev(summary0, strong1);
    			append_dev(details4, t19);
    			append_dev(details4, div17);
    			append_dev(div17, details0);
    			append_dev(details0, summary1);
    			append_dev(summary1, strong2);
    			append_dev(details0, t21);
    			append_dev(details0, img3);
    			append_dev(details0, t22);
    			append_dev(details0, select1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			select_option(select1, "both");
    			append_dev(details0, t28);
    			append_dev(details0, div2);
    			append_dev(div2, t29);
    			append_dev(div2, input1);
    			append_dev(details0, t30);
    			append_dev(details0, div3);
    			append_dev(div3, t31);
    			append_dev(div3, input2);
    			append_dev(div17, t32);
    			append_dev(div17, details1);
    			append_dev(details1, summary2);
    			append_dev(summary2, strong3);
    			append_dev(details1, t34);
    			append_dev(details1, div4);
    			append_dev(div4, t35);
    			append_dev(div4, input3);
    			append_dev(details1, t36);
    			append_dev(details1, div5);
    			append_dev(div5, t37);
    			append_dev(div5, input4);
    			append_dev(div17, t38);
    			append_dev(div17, details2);
    			append_dev(details2, summary3);
    			append_dev(summary3, strong4);
    			append_dev(details2, t40);
    			append_dev(details2, div6);
    			append_dev(div6, t41);
    			append_dev(div6, input5);
    			append_dev(details2, t42);
    			append_dev(details2, div7);
    			append_dev(div7, t43);
    			append_dev(div7, input6);
    			append_dev(details2, t44);
    			append_dev(details2, div8);
    			append_dev(div8, t45);
    			append_dev(div8, input7);
    			append_dev(details2, t46);
    			append_dev(details2, div9);
    			append_dev(div9, t47);
    			append_dev(div9, input8);
    			append_dev(details2, t48);
    			append_dev(details2, div10);
    			append_dev(div10, t49);
    			append_dev(div10, input9);
    			append_dev(details2, t50);
    			append_dev(details2, div11);
    			append_dev(div11, t51);
    			append_dev(div11, input10);
    			append_dev(div17, t52);
    			append_dev(div17, details3);
    			append_dev(details3, summary4);
    			append_dev(summary4, strong5);
    			append_dev(details3, t54);
    			append_dev(details3, div12);
    			append_dev(div12, t55);
    			append_dev(div12, input11);
    			append_dev(details3, t56);
    			append_dev(details3, div13);
    			append_dev(div13, t57);
    			append_dev(div13, input12);
    			append_dev(details3, t58);
    			append_dev(details3, div14);
    			append_dev(div14, t59);
    			append_dev(div14, input13);
    			append_dev(details3, t60);
    			append_dev(details3, div15);
    			append_dev(div15, t61);
    			append_dev(div15, input14);
    			append_dev(div17, t62);
    			append_dev(div17, div16);
    			append_dev(div29, t64);
    			append_dev(div29, details5);
    			append_dev(details5, summary5);
    			append_dev(summary5, strong6);
    			append_dev(details5, t66);
    			append_dev(details5, div18);
    			append_dev(div18, img4);
    			append_dev(div18, t67);
    			append_dev(div18, t68);
    			append_dev(div18, t69);
    			append_dev(div18, input15);
    			set_input_value(input15, /*audioMusicVolume*/ ctx[0]);
    			append_dev(details5, t70);
    			append_dev(details5, div19);
    			append_dev(div19, img5);
    			append_dev(div19, t71);
    			append_dev(div19, t72);
    			append_dev(div19, t73);
    			append_dev(div19, input16);
    			set_input_value(input16, /*audioSfxVolume*/ ctx[1]);
    			append_dev(details5, t74);
    			append_dev(details5, div20);
    			append_dev(div20, img6);
    			append_dev(div20, t75);
    			append_dev(div20, t76);
    			append_dev(div20, t77);
    			append_dev(div20, input17);
    			set_input_value(input17, /*audioUiVolume*/ ctx[2]);
    			append_dev(details5, t78);
    			append_dev(details5, div21);
    			append_dev(div21, img7);
    			append_dev(div21, t79);
    			append_dev(div21, input18);
    			append_dev(details5, t80);
    			append_dev(details5, div22);
    			append_dev(div22, t81);
    			append_dev(div22, input19);
    			append_dev(details5, t82);
    			append_dev(details5, div23);
    			append_dev(div23, t83);
    			append_dev(div23, input20);
    			append_dev(div29, t84);
    			append_dev(div29, details6);
    			append_dev(details6, summary6);
    			append_dev(summary6, strong7);
    			append_dev(details6, t86);
    			append_dev(details6, div24);
    			append_dev(div24, img8);
    			append_dev(div24, t87);
    			append_dev(div24, input21);
    			append_dev(details6, t88);
    			append_dev(details6, div25);
    			append_dev(div25, t89);
    			append_dev(div25, input22);
    			append_dev(details6, t90);
    			append_dev(details6, div26);
    			append_dev(div26, t91);
    			append_dev(div26, input23);
    			append_dev(details6, t92);
    			append_dev(details6, div27);
    			append_dev(div27, img9);
    			append_dev(div27, t93);
    			append_dev(div27, input24);
    			append_dev(details6, t94);
    			append_dev(details6, div28);
    			append_dev(div28, img10);
    			append_dev(div28, t95);
    			append_dev(div28, input25);
    			insert_dev(target, t96, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t98, anchor);
    			insert_dev(target, button2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input15, "change", /*input15_change_input_handler*/ ctx[5]),
    					listen_dev(input15, "input", /*input15_change_input_handler*/ ctx[5]),
    					listen_dev(input16, "change", /*input16_change_input_handler*/ ctx[6]),
    					listen_dev(input16, "input", /*input16_change_input_handler*/ ctx[6]),
    					listen_dev(input17, "change", /*input17_change_input_handler*/ ctx[7]),
    					listen_dev(input17, "input", /*input17_change_input_handler*/ ctx[7]),
    					listen_dev(button1, "click", applySettings, false, false, false),
    					listen_dev(button2, "click", defaultSettings, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*audioMusicVolume*/ 1) set_data_dev(t68, /*audioMusicVolume*/ ctx[0]);

    			if (dirty & /*audioMusicVolume*/ 1) {
    				set_input_value(input15, /*audioMusicVolume*/ ctx[0]);
    			}

    			if (dirty & /*audioSfxVolume*/ 2) set_data_dev(t72, /*audioSfxVolume*/ ctx[1]);

    			if (dirty & /*audioSfxVolume*/ 2) {
    				set_input_value(input16, /*audioSfxVolume*/ ctx[1]);
    			}

    			if (dirty & /*audioUiVolume*/ 4) set_data_dev(t76, /*audioUiVolume*/ ctx[2]);

    			if (dirty & /*audioUiVolume*/ 4) {
    				set_input_value(input17, /*audioUiVolume*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div29);
    			if (detaching) detach_dev(t96);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t98);
    			if (detaching) detach_dev(button2);
    			mounted = false;
    			run_all(dispose);
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

    function defaultSettings() {
    	localStorage.clear();
    	history.go(0);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let nonFunctional = "./images/icons/non-functional.svg";
    	let refresh = "./images/icons/refresh.svg";

    	onMount(() => {
    		
    	}); /*function loadSettings() {
    	let pref = JSON.parse(localStorage.getItem('settings'));
    	for (let i = 0; i < Object.keys(pref).length; i++) {
    		console.log(Object.keys(pref)[i] + " = " + Object.values(pref)[i]);
    		if (Object.values(pref)[i] == (true || false)) {
    			document.getElementById(Object.keys(pref)[i]).checked = Object.values(pref)[i]
    		} else {
    			document.getElementById(Object.keys(pref)[i]).value = Object.values(pref)[i]
    		}
    	}
    }
    loadSettings()*/

    	let audioMusicVolume = "100";
    	let audioSfxVolume = "100";
    	let audioUiVolume = "100";

    	const onKeyDown = event => {
    		surenot.value = event.key;
    		event.preventDefault();
    	};

    	window.onload = () => notsure.addEventListener('keydown', onKeyDown);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function input15_change_input_handler() {
    		audioMusicVolume = to_number(this.value);
    		$$invalidate(0, audioMusicVolume);
    	}

    	function input16_change_input_handler() {
    		audioSfxVolume = to_number(this.value);
    		$$invalidate(1, audioSfxVolume);
    	}

    	function input17_change_input_handler() {
    		audioUiVolume = to_number(this.value);
    		$$invalidate(2, audioUiVolume);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		nonFunctional,
    		refresh,
    		audioMusicVolume,
    		audioSfxVolume,
    		audioUiVolume,
    		defaultSettings,
    		onKeyDown
    	});

    	$$self.$inject_state = $$props => {
    		if ('nonFunctional' in $$props) $$invalidate(3, nonFunctional = $$props.nonFunctional);
    		if ('refresh' in $$props) $$invalidate(4, refresh = $$props.refresh);
    		if ('audioMusicVolume' in $$props) $$invalidate(0, audioMusicVolume = $$props.audioMusicVolume);
    		if ('audioSfxVolume' in $$props) $$invalidate(1, audioSfxVolume = $$props.audioSfxVolume);
    		if ('audioUiVolume' in $$props) $$invalidate(2, audioUiVolume = $$props.audioUiVolume);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		audioMusicVolume,
    		audioSfxVolume,
    		audioUiVolume,
    		nonFunctional,
    		refresh,
    		input15_change_input_handler,
    		input16_change_input_handler,
    		input17_change_input_handler
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/ui/win/Credits.svelte generated by Svelte v3.49.0 */

    const file$1 = "src/ui/win/Credits.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let br0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let br1;
    	let br2;
    	let t1;
    	let h20;
    	let t3;
    	let br3;
    	let t4;
    	let div0;
    	let table0;
    	let tr0;
    	let td0;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let td1;
    	let a0;
    	let br4;
    	let t7;
    	let t8;
    	let td2;
    	let img2;
    	let img2_src_value;
    	let t9;
    	let td3;
    	let a1;
    	let br5;
    	let t11;
    	let t12;
    	let td4;
    	let img3;
    	let img3_src_value;
    	let t13;
    	let td5;
    	let a2;
    	let br6;
    	let t15;
    	let t16;
    	let br7;
    	let t17;
    	let h21;
    	let t19;
    	let br8;
    	let t20;
    	let div1;
    	let table1;
    	let tr1;
    	let td6;
    	let a3;
    	let t22;
    	let td7;
    	let img4;
    	let img4_src_value;
    	let t23;
    	let td8;
    	let t25;
    	let br9;
    	let t26;
    	let a4;
    	let t28;
    	let a5;
    	let t30;
    	let a6;
    	let br10;
    	let t32;
    	let a7;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			br0 = element("br");
    			img0 = element("img");
    			t0 = space();
    			br1 = element("br");
    			br2 = element("br");
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "developers";
    			t3 = space();
    			br3 = element("br");
    			t4 = space();
    			div0 = element("div");
    			table0 = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			img1 = element("img");
    			t5 = space();
    			td1 = element("td");
    			a0 = element("a");
    			a0.textContent = "Ado1928";
    			br4 = element("br");
    			t7 = text("Creator");
    			t8 = space();
    			td2 = element("td");
    			img2 = element("img");
    			t9 = space();
    			td3 = element("td");
    			a1 = element("a");
    			a1.textContent = "ifritdiezel";
    			br5 = element("br");
    			t11 = text("Back-End");
    			t12 = space();
    			td4 = element("td");
    			img3 = element("img");
    			t13 = space();
    			td5 = element("td");
    			a2 = element("a");
    			a2.textContent = "macimas";
    			br6 = element("br");
    			t15 = text("Front-End");
    			t16 = space();
    			br7 = element("br");
    			t17 = space();
    			h21 = element("h2");
    			h21.textContent = "contributors";
    			t19 = space();
    			br8 = element("br");
    			t20 = space();
    			div1 = element("div");
    			table1 = element("table");
    			tr1 = element("tr");
    			td6 = element("td");
    			a3 = element("a");
    			a3.textContent = "hyxud";
    			t22 = space();
    			td7 = element("td");
    			img4 = element("img");
    			t23 = space();
    			td8 = element("td");
    			td8.textContent = "Mouse placing";
    			t25 = space();
    			br9 = element("br");
    			t26 = text("\n\n\tMade with ");
    			a4 = element("a");
    			a4.textContent = "Node.js";
    			t28 = text(", ");
    			a5 = element("a");
    			a5.textContent = "Three.js";
    			t30 = text(", and ");
    			a6 = element("a");
    			a6.textContent = "Svelte";
    			br10 = element("br");
    			t32 = text("\n\tSounds generated with ");
    			a7 = element("a");
    			a7.textContent = "jsfxr";
    			add_location(br0, file$1, 1, 1, 33);
    			if (!src_url_equal(img0.src, img0_src_value = "./images/logo/adocubes-text.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "adocubes");
    			attr_dev(img0, "target", "_blank");
    			attr_dev(img0, "rel", "noopener noreferrer");
    			add_location(img0, file$1, 1, 5, 37);
    			add_location(br1, file$1, 2, 1, 139);
    			add_location(br2, file$1, 2, 5, 143);
    			add_location(h20, file$1, 4, 1, 150);
    			add_location(br3, file$1, 5, 1, 171);
    			attr_dev(img1, "class", "round scale");
    			if (!src_url_equal(img1.src, img1_src_value = "https://github.com/ado1928.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "height", "64");
    			add_location(img1, file$1, 9, 8, 269);
    			add_location(td0, file$1, 9, 4, 265);
    			attr_dev(a0, "href", "https://github.com/ado1928");
    			add_location(a0, file$1, 10, 8, 357);
    			add_location(br4, file$1, 10, 56, 405);
    			add_location(td1, file$1, 10, 4, 353);
    			attr_dev(img2, "class", "round scale");
    			if (!src_url_equal(img2.src, img2_src_value = "https://github.com/ifritdiezel.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "height", "64");
    			add_location(img2, file$1, 11, 8, 430);
    			add_location(td2, file$1, 11, 4, 426);
    			attr_dev(a1, "href", "https://github.com/ifritdiezel");
    			add_location(a1, file$1, 12, 8, 522);
    			add_location(br5, file$1, 12, 64, 578);
    			add_location(td3, file$1, 12, 4, 518);
    			attr_dev(img3, "class", "round scale");
    			if (!src_url_equal(img3.src, img3_src_value = "https://github.com/macimas.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "height", "64");
    			add_location(img3, file$1, 13, 8, 604);
    			add_location(td4, file$1, 13, 4, 600);
    			attr_dev(a2, "href", "https://github.com/macimas");
    			add_location(a2, file$1, 14, 8, 692);
    			add_location(br6, file$1, 14, 56, 740);
    			add_location(td5, file$1, 14, 4, 688);
    			add_location(tr0, file$1, 8, 3, 256);
    			attr_dev(table0, "class", "credits");
    			add_location(table0, file$1, 7, 2, 229);
    			set_style(div0, "display", "flex");
    			set_style(div0, "justify-content", "center");
    			add_location(div0, file$1, 6, 1, 177);
    			add_location(br7, file$1, 17, 7, 786);
    			add_location(h21, file$1, 19, 1, 793);
    			add_location(br8, file$1, 20, 1, 816);
    			attr_dev(a3, "href", "https://github.com/hyxud");
    			add_location(a3, file$1, 24, 8, 914);
    			add_location(td6, file$1, 24, 4, 910);
    			attr_dev(img4, "class", "round scale");
    			if (!src_url_equal(img4.src, img4_src_value = "https://github.com/hyxud.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "height", "20");
    			add_location(img4, file$1, 25, 8, 972);
    			add_location(td7, file$1, 25, 4, 968);
    			add_location(td8, file$1, 26, 4, 1054);
    			add_location(tr1, file$1, 23, 3, 901);
    			attr_dev(table1, "class", "credits");
    			add_location(table1, file$1, 22, 2, 874);
    			set_style(div1, "display", "flex");
    			set_style(div1, "justify-content", "center");
    			add_location(div1, file$1, 21, 1, 822);
    			add_location(br9, file$1, 29, 7, 1104);
    			attr_dev(a4, "href", "https://nodejs.org");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "rel", "noopener noreferrer");
    			add_location(a4, file$1, 31, 11, 1121);
    			attr_dev(a5, "href", "https://threejs.org");
    			attr_dev(a5, "target", "_blank");
    			attr_dev(a5, "rel", "noopener noreferrer");
    			add_location(a5, file$1, 31, 95, 1205);
    			attr_dev(a6, "href", "https://svelte.dev");
    			attr_dev(a6, "target", "_blank");
    			attr_dev(a6, "rel", "noopener noreferrer");
    			add_location(a6, file$1, 31, 185, 1295);
    			add_location(br10, file$1, 31, 266, 1376);
    			attr_dev(a7, "href", "https://sfxr.me");
    			add_location(a7, file$1, 32, 23, 1404);
    			set_style(div2, "text-align", "center");
    			add_location(div2, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, br0);
    			append_dev(div2, img0);
    			append_dev(div2, t0);
    			append_dev(div2, br1);
    			append_dev(div2, br2);
    			append_dev(div2, t1);
    			append_dev(div2, h20);
    			append_dev(div2, t3);
    			append_dev(div2, br3);
    			append_dev(div2, t4);
    			append_dev(div2, div0);
    			append_dev(div0, table0);
    			append_dev(table0, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, img1);
    			append_dev(tr0, t5);
    			append_dev(tr0, td1);
    			append_dev(td1, a0);
    			append_dev(td1, br4);
    			append_dev(td1, t7);
    			append_dev(tr0, t8);
    			append_dev(tr0, td2);
    			append_dev(td2, img2);
    			append_dev(tr0, t9);
    			append_dev(tr0, td3);
    			append_dev(td3, a1);
    			append_dev(td3, br5);
    			append_dev(td3, t11);
    			append_dev(tr0, t12);
    			append_dev(tr0, td4);
    			append_dev(td4, img3);
    			append_dev(tr0, t13);
    			append_dev(tr0, td5);
    			append_dev(td5, a2);
    			append_dev(td5, br6);
    			append_dev(td5, t15);
    			append_dev(div0, t16);
    			append_dev(div2, br7);
    			append_dev(div2, t17);
    			append_dev(div2, h21);
    			append_dev(div2, t19);
    			append_dev(div2, br8);
    			append_dev(div2, t20);
    			append_dev(div2, div1);
    			append_dev(div1, table1);
    			append_dev(table1, tr1);
    			append_dev(tr1, td6);
    			append_dev(td6, a3);
    			append_dev(tr1, t22);
    			append_dev(tr1, td7);
    			append_dev(td7, img4);
    			append_dev(tr1, t23);
    			append_dev(tr1, td8);
    			append_dev(div1, t25);
    			append_dev(div2, br9);
    			append_dev(div2, t26);
    			append_dev(div2, a4);
    			append_dev(div2, t28);
    			append_dev(div2, a5);
    			append_dev(div2, t30);
    			append_dev(div2, a6);
    			append_dev(div2, br10);
    			append_dev(div2, t32);
    			append_dev(div2, a7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Credits', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Credits> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Credits extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Credits",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.49.0 */
    const file = "src/App.svelte";

    // (36:1) <Window id="settings" title="settings">
    function create_default_slot_1(ctx) {
    	let settings;
    	let current;
    	settings = new Settings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(36:1) <Window id=\\\"settings\\\" title=\\\"settings\\\">",
    		ctx
    	});

    	return block;
    }

    // (37:1) <Window id="credits" title="credits">
    function create_default_slot(ctx) {
    	let credits;
    	let current;
    	credits = new Credits({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(credits.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(credits, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(credits.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(credits.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(credits, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(37:1) <Window id=\\\"credits\\\" title=\\\"credits\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let welcome;
    	let t0;
    	let main;
    	let div0;
    	let palette;
    	let t1;
    	let switchplacement;
    	let t2;
    	let coordinates;
    	let t3;
    	let chat;
    	let t4;
    	let img;
    	let img_src_value;
    	let t5;
    	let div4;
    	let div1;
    	let t6;
    	let div2;
    	let t7;
    	let div3;
    	let t8;
    	let esc;
    	let t9;
    	let window0;
    	let t10;
    	let window1;
    	let current;
    	welcome = new Welcome({ $$inline: true });
    	palette = new Palette({ $$inline: true });
    	switchplacement = new SwitchPlacement({ $$inline: true });
    	coordinates = new Coordinates({ $$inline: true });
    	chat = new Chat({ $$inline: true });
    	esc = new Esc({ $$inline: true });

    	window0 = new Window({
    			props: {
    				id: "settings",
    				title: "settings",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window1 = new Window({
    			props: {
    				id: "credits",
    				title: "credits",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(welcome.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div0 = element("div");
    			create_component(palette.$$.fragment);
    			t1 = space();
    			create_component(switchplacement.$$.fragment);
    			t2 = space();
    			create_component(coordinates.$$.fragment);
    			t3 = space();
    			create_component(chat.$$.fragment);
    			t4 = space();
    			img = element("img");
    			t5 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t6 = space();
    			div2 = element("div");
    			t7 = space();
    			div3 = element("div");
    			t8 = space();
    			create_component(esc.$$.fragment);
    			t9 = space();
    			create_component(window0.$$.fragment);
    			t10 = space();
    			create_component(window1.$$.fragment);
    			attr_dev(img, "id", "crosshair");
    			attr_dev(img, "class", "center");
    			if (!src_url_equal(img.src, img_src_value = "./images/svgs/crosshair.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "+");
    			add_location(img, file, 25, 2, 658);
    			attr_dev(div0, "id", "uiCanvas");
    			add_location(div0, file, 19, 1, 558);
    			attr_dev(div1, "id", "joyMovementYDiv");
    			set_style(div1, "position", "absolute");
    			set_style(div1, "bottom", "140px");
    			set_style(div1, "left", "6px");
    			set_style(div1, "width", "160px");
    			set_style(div1, "height", "160px");
    			add_location(div1, file, 29, 2, 774);
    			attr_dev(div2, "id", "joyMovementXZDiv");
    			set_style(div2, "position", "absolute");
    			set_style(div2, "bottom", "6px");
    			set_style(div2, "left", "6px");
    			set_style(div2, "width", "160px");
    			set_style(div2, "height", "160px");
    			add_location(div2, file, 30, 2, 877);
    			attr_dev(div3, "id", "joyCameraDiv");
    			set_style(div3, "position", "absolute");
    			set_style(div3, "bottom", "6px");
    			set_style(div3, "right", "6px");
    			set_style(div3, "width", "200px");
    			set_style(div3, "height", "200px");
    			add_location(div3, file, 31, 2, 979);
    			attr_dev(div4, "id", "mobileControls");
    			add_location(div4, file, 28, 1, 746);
    			add_location(main, file, 18, 0, 550);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(welcome, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			mount_component(palette, div0, null);
    			append_dev(div0, t1);
    			mount_component(switchplacement, div0, null);
    			append_dev(div0, t2);
    			mount_component(coordinates, div0, null);
    			append_dev(div0, t3);
    			mount_component(chat, div0, null);
    			append_dev(div0, t4);
    			append_dev(div0, img);
    			append_dev(main, t5);
    			append_dev(main, div4);
    			append_dev(div4, div1);
    			append_dev(div4, t6);
    			append_dev(div4, div2);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(main, t8);
    			mount_component(esc, main, null);
    			append_dev(main, t9);
    			mount_component(window0, main, null);
    			append_dev(main, t10);
    			mount_component(window1, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const window0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				window0_changes.$$scope = { dirty, ctx };
    			}

    			window0.$set(window0_changes);
    			const window1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				window1_changes.$$scope = { dirty, ctx };
    			}

    			window1.$set(window1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(welcome.$$.fragment, local);
    			transition_in(palette.$$.fragment, local);
    			transition_in(switchplacement.$$.fragment, local);
    			transition_in(coordinates.$$.fragment, local);
    			transition_in(chat.$$.fragment, local);
    			transition_in(esc.$$.fragment, local);
    			transition_in(window0.$$.fragment, local);
    			transition_in(window1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(welcome.$$.fragment, local);
    			transition_out(palette.$$.fragment, local);
    			transition_out(switchplacement.$$.fragment, local);
    			transition_out(coordinates.$$.fragment, local);
    			transition_out(chat.$$.fragment, local);
    			transition_out(esc.$$.fragment, local);
    			transition_out(window0.$$.fragment, local);
    			transition_out(window1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(welcome, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(palette);
    			destroy_component(switchplacement);
    			destroy_component(coordinates);
    			destroy_component(chat);
    			destroy_component(esc);
    			destroy_component(window0);
    			destroy_component(window1);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Palette,
    		SwitchPlacement,
    		Coordinates,
    		Sign,
    		Chat,
    		Playerlist,
    		Esc,
    		Window,
    		Welcome,
    		Settings,
    		Credits
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

})();
//# sourceMappingURL=bundle.js.map
