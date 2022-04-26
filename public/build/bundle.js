
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
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

    /* src/ui/canvas/Palette.svelte generated by Svelte v3.47.0 */

    const file$a = "src/ui/canvas/Palette.svelte";

    function create_fragment$a(ctx) {
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
    			add_location(div0, file$a, 1, 1, 32);
    			set_style(div1, "background", "#AAAAAA");
    			add_location(div1, file$a, 2, 1, 68);
    			set_style(div2, "background", "#888888");
    			add_location(div2, file$a, 3, 1, 104);
    			set_style(div3, "background", "#484848");
    			add_location(div3, file$a, 4, 1, 140);
    			set_style(div4, "background", "#000000");
    			add_location(div4, file$a, 5, 1, 176);
    			set_style(div5, "background", "#991609");
    			add_location(div5, file$a, 6, 1, 212);
    			set_style(div6, "background", "#DF250B");
    			add_location(div6, file$a, 7, 1, 248);
    			set_style(div7, "background", "#FF5610");
    			add_location(div7, file$a, 8, 1, 284);
    			set_style(div8, "background", "#FF832A");
    			add_location(div8, file$a, 9, 1, 320);
    			set_style(div9, "background", "#FFB885");
    			add_location(div9, file$a, 10, 1, 356);
    			set_style(div10, "background", "#936100");
    			add_location(div10, file$a, 11, 1, 392);
    			set_style(div11, "background", "#E29705");
    			add_location(div11, file$a, 12, 1, 428);
    			set_style(div12, "background", "#FFD223");
    			add_location(div12, file$a, 13, 1, 464);
    			set_style(div13, "background", "#FFF7AF");
    			add_location(div13, file$a, 14, 1, 500);
    			set_style(div14, "background", "#47561E");
    			add_location(div14, file$a, 15, 1, 536);
    			set_style(div15, "background", "#71892B");
    			add_location(div15, file$a, 16, 1, 572);
    			set_style(div16, "background", "#94BE1A");
    			add_location(div16, file$a, 17, 1, 608);
    			set_style(div17, "background", "#DCFF77");
    			add_location(div17, file$a, 18, 1, 644);
    			set_style(div18, "background", "#124B36");
    			add_location(div18, file$a, 19, 1, 680);
    			set_style(div19, "background", "#0F8158");
    			add_location(div19, file$a, 20, 1, 716);
    			set_style(div20, "background", "#03C07C");
    			add_location(div20, file$a, 21, 1, 752);
    			set_style(div21, "background", "#90FFCA");
    			add_location(div21, file$a, 22, 1, 788);
    			set_style(div22, "background", "#024851");
    			add_location(div22, file$a, 23, 1, 824);
    			set_style(div23, "background", "#0D7A89");
    			add_location(div23, file$a, 24, 1, 860);
    			set_style(div24, "background", "#01A6BD");
    			add_location(div24, file$a, 25, 1, 896);
    			set_style(div25, "background", "#34E7FF");
    			add_location(div25, file$a, 26, 1, 932);
    			set_style(div26, "background", "#013462");
    			add_location(div26, file$a, 27, 1, 968);
    			set_style(div27, "background", "#0D569A");
    			add_location(div27, file$a, 28, 1, 1004);
    			set_style(div28, "background", "#066ECE");
    			add_location(div28, file$a, 29, 1, 1040);
    			set_style(div29, "background", "#4CA9FF");
    			add_location(div29, file$a, 30, 1, 1076);
    			set_style(div30, "background", "#181691");
    			add_location(div30, file$a, 31, 1, 1112);
    			set_style(div31, "background", "#2A25F5");
    			add_location(div31, file$a, 32, 1, 1148);
    			set_style(div32, "background", "#4E55FF");
    			add_location(div32, file$a, 33, 1, 1184);
    			set_style(div33, "background", "#9DB8FF");
    			add_location(div33, file$a, 34, 1, 1220);
    			set_style(div34, "background", "#58196B");
    			add_location(div34, file$a, 35, 1, 1256);
    			set_style(div35, "background", "#AC01E0");
    			add_location(div35, file$a, 36, 1, 1292);
    			set_style(div36, "background", "#C82EF7");
    			add_location(div36, file$a, 37, 1, 1328);
    			set_style(div37, "background", "#DC91FF");
    			add_location(div37, file$a, 38, 1, 1364);
    			set_style(div38, "background", "#650036");
    			add_location(div38, file$a, 39, 1, 1400);
    			set_style(div39, "background", "#B0114B");
    			add_location(div39, file$a, 40, 1, 1436);
    			set_style(div40, "background", "#EA3477");
    			add_location(div40, file$a, 41, 1, 1472);
    			set_style(div41, "background", "#FF95BC");
    			add_location(div41, file$a, 42, 1, 1508);
    			set_style(div42, "background", "#62071D");
    			add_location(div42, file$a, 43, 1, 1544);
    			set_style(div43, "background", "#9B0834");
    			add_location(div43, file$a, 44, 1, 1580);
    			set_style(div44, "background", "#CB003D");
    			add_location(div44, file$a, 45, 1, 1616);
    			set_style(div45, "background", "#FF7384");
    			add_location(div45, file$a, 46, 1, 1652);
    			set_style(div46, "background", "#49230A");
    			add_location(div46, file$a, 47, 1, 1688);
    			set_style(div47, "background", "#814A17");
    			add_location(div47, file$a, 48, 1, 1724);
    			set_style(div48, "background", "#D17A2B");
    			add_location(div48, file$a, 49, 1, 1760);
    			set_style(div49, "background", "#FFB470");
    			add_location(div49, file$a, 50, 1, 1796);
    			attr_dev(div50, "id", "palette");
    			attr_dev(div50, "class", "box");
    			add_location(div50, file$a, 0, 0, 0);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Palette",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/ui/canvas/Coordinates.svelte generated by Svelte v3.47.0 */

    const file$9 = "src/ui/canvas/Coordinates.svelte";

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

    /* src/ui/canvas/SwitchPlacement.svelte generated by Svelte v3.47.0 */

    const file$8 = "src/ui/canvas/SwitchPlacement.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			img0 = element("img");
    			t = space();
    			button1 = element("button");
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "./images/icons/place at raycast.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "place at raycast");
    			add_location(img0, file$8, 6, 68, 181);
    			attr_dev(button0, "id", "placeAtRaycast");
    			attr_dev(button0, "class", "icon");
    			add_location(button0, file$8, 6, 1, 114);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/place in camera.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "place in camera");
    			add_location(img1, file$8, 7, 66, 327);
    			attr_dev(button1, "id", "placeInCamera");
    			attr_dev(button1, "class", "icon");
    			add_location(button1, file$8, 7, 1, 262);
    			attr_dev(div, "id", "switchPlacement");
    			attr_dev(div, "class", "box");
    			add_location(div, file$8, 5, 0, 74);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, img0);
    			append_dev(div, t);
    			append_dev(div, button1);
    			append_dev(button1, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*placeAtRaycast*/ ctx[0])) /*placeAtRaycast*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*placeInCamera*/ ctx[1])) /*placeInCamera*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
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

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SwitchPlacement', slots, []);
    	let { placeAtRaycast } = $$props;
    	let { placeInCamera } = $$props;
    	const writable_props = ['placeAtRaycast', 'placeInCamera'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SwitchPlacement> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('placeAtRaycast' in $$props) $$invalidate(0, placeAtRaycast = $$props.placeAtRaycast);
    		if ('placeInCamera' in $$props) $$invalidate(1, placeInCamera = $$props.placeInCamera);
    	};

    	$$self.$capture_state = () => ({ placeAtRaycast, placeInCamera });

    	$$self.$inject_state = $$props => {
    		if ('placeAtRaycast' in $$props) $$invalidate(0, placeAtRaycast = $$props.placeAtRaycast);
    		if ('placeInCamera' in $$props) $$invalidate(1, placeInCamera = $$props.placeInCamera);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeAtRaycast, placeInCamera];
    }

    class SwitchPlacement extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { placeAtRaycast: 0, placeInCamera: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SwitchPlacement",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*placeAtRaycast*/ ctx[0] === undefined && !('placeAtRaycast' in props)) {
    			console.warn("<SwitchPlacement> was created without expected prop 'placeAtRaycast'");
    		}

    		if (/*placeInCamera*/ ctx[1] === undefined && !('placeInCamera' in props)) {
    			console.warn("<SwitchPlacement> was created without expected prop 'placeInCamera'");
    		}
    	}

    	get placeAtRaycast() {
    		throw new Error("<SwitchPlacement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeAtRaycast(value) {
    		throw new Error("<SwitchPlacement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeInCamera() {
    		throw new Error("<SwitchPlacement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeInCamera(value) {
    		throw new Error("<SwitchPlacement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ui/canvas/Chat.svelte generated by Svelte v3.47.0 */

    const file$7 = "src/ui/canvas/Chat.svelte";

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
    			add_location(input, file$7, 3, 1, 58);
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

    /* src/ui/esc/Esc.svelte generated by Svelte v3.47.0 */

    const file$6 = "src/ui/esc/Esc.svelte";

    function create_fragment$6(ctx) {
    	let div2;
    	let div1;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let t7;
    	let br;
    	let t8;
    	let div0;
    	let a0;
    	let t10;
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
    			button1.textContent = "Controls";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Credits";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "Settings";
    			t7 = space();
    			br = element("br");
    			t8 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Source code";
    			t10 = text(" • ");
    			a1 = element("a");
    			a1.textContent = "Discord server";
    			attr_dev(button0, "id", "escReturn");
    			add_location(button0, file$6, 31, 2, 773);
    			attr_dev(button1, "id", "escControls");
    			add_location(button1, file$6, 32, 2, 835);
    			attr_dev(button2, "id", "escCredits");
    			add_location(button2, file$6, 33, 2, 903);
    			attr_dev(button3, "id", "escSettings");
    			add_location(button3, file$6, 34, 2, 968);
    			add_location(br, file$6, 36, 2, 1037);
    			attr_dev(a0, "href", "https://github.com/ado1928/ado-cubes");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$6, 39, 3, 1106);
    			attr_dev(a1, "href", "https://discord.gg/rNMTeADfnc");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$6, 39, 118, 1221);
    			set_style(div0, "display", "flex");
    			set_style(div0, "flex-direction", "row");
    			set_style(div0, "width", "auto");
    			add_location(div0, file$6, 38, 2, 1045);
    			attr_dev(div1, "id", "escMenu");
    			attr_dev(div1, "class", "box center");
    			add_location(div1, file$6, 30, 1, 733);
    			attr_dev(div2, "id", "esc");
    			add_location(div2, file$6, 29, 0, 717);
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
    			append_dev(div1, button3);
    			append_dev(div1, t7);
    			append_dev(div1, br);
    			append_dev(div1, t8);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t10);
    			append_dev(div0, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", escReturn, false, false, false),
    					listen_dev(button1, "click", escControls, false, false, false),
    					listen_dev(button2, "click", escCredits, false, false, false),
    					listen_dev(button3, "click", escSettings, false, false, false)
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function escReturn() {
    	esc.style.display = "none";
    }

    function escControls() {
    	esc.style.display = "none";
    	winControls.style.display = "block";
    }

    function escCredits() {
    	esc.style.display = "none";
    	winCredits.style.display = "block";
    }

    function escSettings() {
    	esc.style.display = "none";
    	winSettings.style.display = "block";
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Esc', slots, []);

    	document.onkeydown = function (e) {
    		if (e.key === "Escape" && document.activeElement.tagName !== "INPUT") {
    			esc.style.display = esc.style.display == "block" ? "none" : "block";
    			winControls.style.display = "none";
    			winCredits.style.display = "none";
    			winSettings.style.display = "none";
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Esc> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		escReturn,
    		escControls,
    		escCredits,
    		escSettings
    	});

    	return [];
    }

    class Esc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Esc",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/ui/esc/EscWinNavs.svelte generated by Svelte v3.47.0 */

    const file$5 = "src/ui/esc/EscWinNavs.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let strong;
    	let t1;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			img0 = element("img");
    			t0 = space();
    			strong = element("strong");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			button1 = element("button");
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "./images/icons/left arrow.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "<=");
    			add_location(img0, file$5, 13, 43, 381);
    			attr_dev(button0, "class", "iconav");
    			add_location(button0, file$5, 13, 1, 339);
    			add_location(strong, file$5, 14, 1, 442);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/exit.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "X");
    			add_location(img1, file$5, 15, 43, 510);
    			attr_dev(button1, "class", "iconav");
    			add_location(button1, file$5, 15, 1, 468);
    			set_style(div, "display", "flex");
    			set_style(div, "justify-content", "space-between");
    			set_style(div, "align-items", "center");
    			set_style(div, "padding", "4px 4px");
    			set_style(div, "margin-bottom", "12px");
    			add_location(div, file$5, 12, 0, 226);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, img0);
    			append_dev(div, t0);
    			append_dev(div, strong);

    			if (default_slot) {
    				default_slot.m(strong, null);
    			}

    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, img1);
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
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
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

    function escBack() {
    	escExit();
    	esc.style.display = "flex";
    }

    function escExit() {
    	winSettings.style.display = "none";
    	winControls.style.display = "none";
    	winCredits.style.display = "none";
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EscWinNavs', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EscWinNavs> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ escBack, escExit });
    	return [$$scope, slots];
    }

    class EscWinNavs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EscWinNavs",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/ui/misc/Welcome.svelte generated by Svelte v3.47.0 */

    const file$4 = "src/ui/misc/Welcome.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let br0;
    	let br1;
    	let t1;
    	let input0;
    	let br2;
    	let t2;
    	let input1;
    	let br3;
    	let t3;
    	let p0;
    	let t4;
    	let br4;
    	let t5;
    	let br5;
    	let br6;
    	let t6;
    	let strong0;
    	let t8;
    	let br7;
    	let br8;
    	let t9;
    	let strong1;
    	let t11;
    	let br9;
    	let t12;
    	let br10;
    	let t13;
    	let p1;
    	let br11;
    	let t14;
    	let t15;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t1 = text("\n\tUsername: ");
    			input0 = element("input");
    			br2 = element("br");
    			t2 = text("\n\tPassword: ");
    			input1 = element("input");
    			br3 = element("br");
    			t3 = space();
    			p0 = element("p");
    			t4 = text("It's seems you have disabled verification.");
    			br4 = element("br");
    			t5 = text("Please note that you won't be able to connect to the server.");
    			br5 = element("br");
    			br6 = element("br");
    			t6 = space();
    			strong0 = element("strong");
    			strong0.textContent = "IMPORTANT: ";
    			t8 = text("You can check controls by pressing Escape, and then selecting Controls.");
    			br7 = element("br");
    			br8 = element("br");
    			t9 = space();
    			strong1 = element("strong");
    			strong1.textContent = "NOTE: ";
    			t11 = text("iocaptcha at this time is a bit iffy.");
    			br9 = element("br");
    			t12 = text("If a captcha is a too hard for you, either refresh page or report it.");
    			br10 = element("br");
    			t13 = text("Not entirely sure if reporting even works.\n\n\t");
    			p1 = element("p");
    			br11 = element("br");
    			t14 = text("Please take the captcha! If you can't see it, please refresh page.");
    			t15 = space();
    			div0 = element("div");
    			attr_dev(img, "id", "welcomeLogo");
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "style", /*style*/ ctx[1]);
    			add_location(img, file$4, 11, 1, 405);
    			add_location(br0, file$4, 12, 1, 443);
    			add_location(br1, file$4, 12, 5, 447);
    			attr_dev(input0, "id", "inputUsername");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$4, 13, 11, 463);
    			add_location(br2, file$4, 13, 49, 501);
    			attr_dev(input1, "id", "inputPassword");
    			attr_dev(input1, "type", "text");
    			input1.value = "this input does nothing for now. pls ignore";
    			add_location(input1, file$4, 14, 11, 517);
    			add_location(br3, file$4, 14, 101, 607);
    			add_location(br4, file$4, 15, 88, 700);
    			add_location(br5, file$4, 15, 152, 764);
    			attr_dev(p0, "id", "noNeedToVerify");
    			set_style(p0, "display", "none");
    			add_location(p0, file$4, 15, 1, 613);
    			add_location(br6, file$4, 15, 160, 772);
    			add_location(strong0, file$4, 17, 1, 779);
    			add_location(br7, file$4, 17, 100, 878);
    			add_location(br8, file$4, 17, 104, 882);
    			add_location(strong1, file$4, 19, 1, 889);
    			add_location(br9, file$4, 19, 61, 949);
    			add_location(br10, file$4, 19, 134, 1022);
    			add_location(br11, file$4, 21, 45, 1115);
    			attr_dev(p1, "id", "captchaPlease");
    			set_style(p1, "display", "none");
    			add_location(p1, file$4, 21, 1, 1071);
    			attr_dev(div0, "class", "io-captcha");
    			attr_dev(div0, "data-pubkey", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO");
    			attr_dev(div0, "data-theme", "dark");
    			attr_dev(div0, "data-scale", "1.0");
    			attr_dev(div0, "data-font", "mono");
    			attr_dev(div0, "data-callback-solve", "solve");
    			attr_dev(div0, "data-widgetid", "iocaptcha");
    			add_location(div0, file$4, 22, 1, 1191);
    			attr_dev(div1, "id", "winWelcome");
    			attr_dev(div1, "class", "box win center");
    			set_style(div1, "top", "62%");
    			add_location(div1, file$4, 10, 0, 343);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, br0);
    			append_dev(div1, br1);
    			append_dev(div1, t1);
    			append_dev(div1, input0);
    			append_dev(div1, br2);
    			append_dev(div1, t2);
    			append_dev(div1, input1);
    			append_dev(div1, br3);
    			append_dev(div1, t3);
    			append_dev(div1, p0);
    			append_dev(p0, t4);
    			append_dev(p0, br4);
    			append_dev(p0, t5);
    			append_dev(p0, br5);
    			append_dev(div1, br6);
    			append_dev(div1, t6);
    			append_dev(div1, strong0);
    			append_dev(div1, t8);
    			append_dev(div1, br7);
    			append_dev(div1, br8);
    			append_dev(div1, t9);
    			append_dev(div1, strong1);
    			append_dev(div1, t11);
    			append_dev(div1, br9);
    			append_dev(div1, t12);
    			append_dev(div1, br10);
    			append_dev(div1, t13);
    			append_dev(div1, p1);
    			append_dev(p1, br11);
    			append_dev(p1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*src*/ 1 && !src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*style*/ 2) {
    				attr_dev(img, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Welcome', slots, []);
    	let src = "./images/logo/adocubes-full.svg";
    	let style = "position:absolute;transform:translate(-50%, -174px);left:50%;z-index:-1;";

    	//  when you see it
    	if (Math.floor(Math.random() * 727) == 1) {
    		src = "./images/logo/ado.svg";
    		style = "position:absolute;transform:translate(-50%, -164px);left:50%;z-index:-1;";
    	}

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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/ui/misc/Controls.svelte generated by Svelte v3.47.0 */

    const file$3 = "src/ui/misc/Controls.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let br3;
    	let t3;
    	let br4;
    	let t4;
    	let br5;
    	let t5;
    	let br6;
    	let br7;
    	let t6;
    	let br8;
    	let t7;
    	let br9;
    	let t8;
    	let br10;
    	let br11;
    	let t9;
    	let br12;
    	let t10;
    	let br13;
    	let br14;
    	let t11;
    	let br15;
    	let t12;
    	let br16;
    	let br17;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = text("\n\tWASD to fly around");
    			br0 = element("br");
    			t1 = text("\n\tSpace to fly up");
    			br1 = element("br");
    			t2 = text("\n\tShift to fly down");
    			br2 = element("br");
    			br3 = element("br");
    			t3 = text("\n\n\tX to place cubes");
    			br4 = element("br");
    			t4 = text("\n\tC to break cubes");
    			br5 = element("br");
    			t5 = text("\n\tG to toggle grid");
    			br6 = element("br");
    			br7 = element("br");
    			t6 = text("\n\n\t[ to decrease camera speed");
    			br8 = element("br");
    			t7 = text("\n\t] to increase camera speed");
    			br9 = element("br");
    			t8 = text("\n\t\\ to reset camera speed");
    			br10 = element("br");
    			br11 = element("br");
    			t9 = text("\n\n\tO to hide UI");
    			br12 = element("br");
    			t10 = text("\n\tP to show UI");
    			br13 = element("br");
    			br14 = element("br");
    			t11 = text("\n\n\tEnter to open chat");
    			br15 = element("br");
    			t12 = text("\n\tL to open settings");
    			br16 = element("br");
    			br17 = element("br");
    			add_location(br0, file$3, 2, 19, 74);
    			add_location(br1, file$3, 3, 16, 95);
    			add_location(br2, file$3, 4, 18, 118);
    			add_location(br3, file$3, 4, 22, 122);
    			add_location(br4, file$3, 6, 17, 145);
    			add_location(br5, file$3, 7, 17, 167);
    			add_location(br6, file$3, 8, 17, 189);
    			add_location(br7, file$3, 8, 21, 193);
    			add_location(br8, file$3, 10, 27, 226);
    			add_location(br9, file$3, 11, 27, 258);
    			add_location(br10, file$3, 12, 24, 287);
    			add_location(br11, file$3, 12, 28, 291);
    			add_location(br12, file$3, 14, 13, 310);
    			add_location(br13, file$3, 15, 13, 328);
    			add_location(br14, file$3, 15, 17, 332);
    			add_location(br15, file$3, 17, 19, 357);
    			add_location(br16, file$3, 18, 19, 381);
    			add_location(br17, file$3, 18, 23, 385);
    			attr_dev(div, "id", "winControls");
    			attr_dev(div, "class", "box win center");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, br0);
    			append_dev(div, t1);
    			append_dev(div, br1);
    			append_dev(div, t2);
    			append_dev(div, br2);
    			append_dev(div, br3);
    			append_dev(div, t3);
    			append_dev(div, br4);
    			append_dev(div, t4);
    			append_dev(div, br5);
    			append_dev(div, t5);
    			append_dev(div, br6);
    			append_dev(div, br7);
    			append_dev(div, t6);
    			append_dev(div, br8);
    			append_dev(div, t7);
    			append_dev(div, br9);
    			append_dev(div, t8);
    			append_dev(div, br10);
    			append_dev(div, br11);
    			append_dev(div, t9);
    			append_dev(div, br12);
    			append_dev(div, t10);
    			append_dev(div, br13);
    			append_dev(div, br14);
    			append_dev(div, t11);
    			append_dev(div, br15);
    			append_dev(div, t12);
    			append_dev(div, br16);
    			append_dev(div, br17);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Controls', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/ui/misc/Settings.svelte generated by Svelte v3.47.0 */

    const file$2 = "src/ui/misc/Settings.svelte";

    function create_fragment$2(ctx) {
    	let div18;
    	let t0;
    	let div17;
    	let h10;
    	let t2;
    	let div0;
    	let t3;
    	let select0;
    	let option0;
    	let option1;
    	let t6;
    	let h11;
    	let t8;
    	let div2;
    	let t9;
    	let select1;
    	let option2;
    	let option3;
    	let option4;
    	let t13;
    	let div1;
    	let input0;
    	let t14;
    	let input1;
    	let t15;
    	let input2;
    	let t16;
    	let input3;
    	let t17;
    	let div3;
    	let t18;
    	let input4;
    	let t19;
    	let div4;
    	let t20;
    	let input5;
    	let t21;
    	let div5;
    	let t22;
    	let input6;
    	let t23;
    	let div6;
    	let t24;
    	let input7;
    	let t25;
    	let div7;
    	let t26;
    	let input8;
    	let t27;
    	let h12;
    	let t29;
    	let div8;
    	let t30;
    	let input9;
    	let t31;
    	let div9;
    	let t32;
    	let input10;
    	let t33;
    	let div10;
    	let t34;
    	let input11;
    	let t35;
    	let div11;
    	let t36;
    	let input12;
    	let t37;
    	let h13;
    	let t39;
    	let div12;
    	let t41;
    	let h14;
    	let t43;
    	let div13;
    	let t44;
    	let input13;
    	let t45;
    	let div14;
    	let t46;
    	let input14;
    	let t47;
    	let h15;
    	let t49;
    	let div15;
    	let strong;
    	let t51;
    	let t52;
    	let div16;
    	let t53;
    	let input15;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div17 = element("div");
    			h10 = element("h1");
    			h10.textContent = "General";
    			t2 = space();
    			div0 = element("div");
    			t3 = text("Language\n\t\t\t");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "English";
    			option1 = element("option");
    			option1.textContent = "Only English.";
    			t6 = space();
    			h11 = element("h1");
    			h11.textContent = "Input";
    			t8 = space();
    			div2 = element("div");
    			t9 = text("Movement\n\t\t\t");
    			select1 = element("select");
    			option2 = element("option");
    			option2.textContent = "WASD";
    			option3 = element("option");
    			option3.textContent = "Arrow keys";
    			option4 = element("option");
    			option4.textContent = "Custom";
    			t13 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t14 = space();
    			input1 = element("input");
    			t15 = space();
    			input2 = element("input");
    			t16 = space();
    			input3 = element("input");
    			t17 = space();
    			div3 = element("div");
    			t18 = text("Place blocks ");
    			input4 = element("input");
    			t19 = space();
    			div4 = element("div");
    			t20 = text("Secondary ");
    			input5 = element("input");
    			t21 = space();
    			div5 = element("div");
    			t22 = text("Remove blocks ");
    			input6 = element("input");
    			t23 = space();
    			div6 = element("div");
    			t24 = text("Secondary ");
    			input7 = element("input");
    			t25 = space();
    			div7 = element("div");
    			t26 = text("Palette skip ");
    			input8 = element("input");
    			t27 = space();
    			h12 = element("h1");
    			h12.textContent = "Audio";
    			t29 = space();
    			div8 = element("div");
    			t30 = text("Master ");
    			input9 = element("input");
    			t31 = space();
    			div9 = element("div");
    			t32 = text("Music ");
    			input10 = element("input");
    			t33 = space();
    			div10 = element("div");
    			t34 = text("SFX ");
    			input11 = element("input");
    			t35 = space();
    			div11 = element("div");
    			t36 = text("UI ");
    			input12 = element("input");
    			t37 = space();
    			h13 = element("h1");
    			h13.textContent = "Performance";
    			t39 = space();
    			div12 = element("div");
    			div12.textContent = "idk what to put here";
    			t41 = space();
    			h14 = element("h1");
    			h14.textContent = "Miscellaneous";
    			t43 = space();
    			div13 = element("div");
    			t44 = text("Disable shadows (why?) ");
    			input13 = element("input");
    			t45 = space();
    			div14 = element("div");
    			t46 = text("Disable ground ");
    			input14 = element("input");
    			t47 = space();
    			h15 = element("h1");
    			h15.textContent = "Theme";
    			t49 = space();
    			div15 = element("div");
    			strong = element("strong");
    			strong.textContent = "NOTE:";
    			t51 = text(" Blur does not properly work in Firefox");
    			t52 = space();
    			div16 = element("div");
    			t53 = space();
    			input15 = element("input");
    			add_location(h10, file$2, 13, 2, 264);
    			option0.__value = "english";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 16, 4, 334);
    			option1.__value = "onlyEnglish";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 17, 4, 379);
    			attr_dev(select0, "id", "generalLanguage");
    			add_location(select0, file$2, 15, 3, 300);
    			add_location(div0, file$2, 14, 2, 283);
    			add_location(h11, file$2, 21, 2, 455);
    			option2.__value = "wasd";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 24, 4, 521);
    			option3.__value = "arrow";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 25, 4, 560);
    			option4.__value = "custom";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 26, 4, 606);
    			attr_dev(select1, "id", "inputMovement");
    			add_location(select1, file$2, 23, 3, 489);
    			input0.value = "KeyW";
    			add_location(input0, file$2, 29, 4, 691);
    			input1.value = "KeyA";
    			add_location(input1, file$2, 30, 4, 716);
    			input2.value = "KeyS";
    			add_location(input2, file$2, 31, 4, 741);
    			input3.value = "KeyD";
    			add_location(input3, file$2, 32, 4, 766);
    			attr_dev(div1, "id", "customMovement");
    			add_location(div1, file$2, 28, 3, 661);
    			add_location(div2, file$2, 22, 2, 472);
    			attr_dev(input4, "id", "inputPlaceBlocks");
    			input4.value = "KeyX";
    			add_location(input4, file$2, 35, 20, 826);
    			add_location(div3, file$2, 35, 2, 808);
    			attr_dev(input5, "id", "inputSecondaryPlaceBlocks");
    			input5.value = "MouseRight";
    			add_location(input5, file$2, 36, 17, 892);
    			add_location(div4, file$2, 36, 2, 877);
    			attr_dev(input6, "id", "inputRemoveBlocks");
    			input6.value = "KeyC";
    			add_location(input6, file$2, 37, 21, 977);
    			add_location(div5, file$2, 37, 2, 958);
    			attr_dev(input7, "id", "inputSecondaryRemoveBlocks");
    			input7.value = "MouseLeft";
    			add_location(input7, file$2, 38, 17, 1044);
    			add_location(div6, file$2, 38, 2, 1029);
    			attr_dev(input8, "id", "inputPaletteSkip");
    			input8.value = "AltLeft";
    			add_location(input8, file$2, 39, 20, 1128);
    			add_location(div7, file$2, 39, 2, 1110);
    			add_location(h12, file$2, 41, 2, 1183);
    			attr_dev(input9, "id", "volumeMaster");
    			attr_dev(input9, "type", "range");
    			add_location(input9, file$2, 42, 14, 1212);
    			add_location(div8, file$2, 42, 2, 1200);
    			attr_dev(input10, "id", "volumeMusic");
    			attr_dev(input10, "type", "range");
    			add_location(input10, file$2, 43, 13, 1270);
    			add_location(div9, file$2, 43, 2, 1259);
    			attr_dev(input11, "id", "volumeSFX");
    			attr_dev(input11, "type", "range");
    			add_location(input11, file$2, 44, 11, 1325);
    			add_location(div10, file$2, 44, 2, 1316);
    			attr_dev(input12, "id", "volumeUI");
    			attr_dev(input12, "type", "range");
    			add_location(input12, file$2, 45, 10, 1377);
    			add_location(div11, file$2, 45, 2, 1369);
    			add_location(h13, file$2, 47, 2, 1421);
    			add_location(div12, file$2, 48, 2, 1444);
    			add_location(h14, file$2, 50, 2, 1479);
    			attr_dev(input13, "type", "checkbox");
    			add_location(input13, file$2, 51, 30, 1532);
    			add_location(div13, file$2, 51, 2, 1504);
    			attr_dev(input14, "type", "checkbox");
    			add_location(input14, file$2, 52, 22, 1584);
    			add_location(div14, file$2, 52, 2, 1564);
    			add_location(h15, file$2, 54, 2, 1617);
    			add_location(strong, file$2, 55, 7, 1639);
    			add_location(div15, file$2, 55, 2, 1634);
    			set_style(div16, "background", "#000");
    			set_style(div16, "height", "130px");
    			set_style(div16, "width", "-moz-available");
    			set_style(div16, "width", "-webkit-fill-available");
    			add_location(div16, file$2, 56, 2, 1709);
    			attr_dev(input15, "type", "file");
    			add_location(input15, file$2, 57, 2, 1810);
    			add_location(div17, file$2, 12, 1, 256);
    			attr_dev(div18, "id", "winSettings");
    			attr_dev(div18, "class", "box win center");
    			add_location(div18, file$2, 10, 0, 200);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);

    			if (default_slot) {
    				default_slot.m(div18, null);
    			}

    			append_dev(div18, t0);
    			append_dev(div18, div17);
    			append_dev(div17, h10);
    			append_dev(div17, t2);
    			append_dev(div17, div0);
    			append_dev(div0, t3);
    			append_dev(div0, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(div17, t6);
    			append_dev(div17, h11);
    			append_dev(div17, t8);
    			append_dev(div17, div2);
    			append_dev(div2, t9);
    			append_dev(div2, select1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(div2, t13);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			append_dev(div1, t14);
    			append_dev(div1, input1);
    			append_dev(div1, t15);
    			append_dev(div1, input2);
    			append_dev(div1, t16);
    			append_dev(div1, input3);
    			append_dev(div17, t17);
    			append_dev(div17, div3);
    			append_dev(div3, t18);
    			append_dev(div3, input4);
    			append_dev(div17, t19);
    			append_dev(div17, div4);
    			append_dev(div4, t20);
    			append_dev(div4, input5);
    			append_dev(div17, t21);
    			append_dev(div17, div5);
    			append_dev(div5, t22);
    			append_dev(div5, input6);
    			append_dev(div17, t23);
    			append_dev(div17, div6);
    			append_dev(div6, t24);
    			append_dev(div6, input7);
    			append_dev(div17, t25);
    			append_dev(div17, div7);
    			append_dev(div7, t26);
    			append_dev(div7, input8);
    			append_dev(div17, t27);
    			append_dev(div17, h12);
    			append_dev(div17, t29);
    			append_dev(div17, div8);
    			append_dev(div8, t30);
    			append_dev(div8, input9);
    			append_dev(div17, t31);
    			append_dev(div17, div9);
    			append_dev(div9, t32);
    			append_dev(div9, input10);
    			append_dev(div17, t33);
    			append_dev(div17, div10);
    			append_dev(div10, t34);
    			append_dev(div10, input11);
    			append_dev(div17, t35);
    			append_dev(div17, div11);
    			append_dev(div11, t36);
    			append_dev(div11, input12);
    			append_dev(div17, t37);
    			append_dev(div17, h13);
    			append_dev(div17, t39);
    			append_dev(div17, div12);
    			append_dev(div17, t41);
    			append_dev(div17, h14);
    			append_dev(div17, t43);
    			append_dev(div17, div13);
    			append_dev(div13, t44);
    			append_dev(div13, input13);
    			append_dev(div17, t45);
    			append_dev(div17, div14);
    			append_dev(div14, t46);
    			append_dev(div14, input14);
    			append_dev(div17, t47);
    			append_dev(div17, h15);
    			append_dev(div17, t49);
    			append_dev(div17, div15);
    			append_dev(div15, strong);
    			append_dev(div15, t51);
    			append_dev(div17, t52);
    			append_dev(div17, div16);
    			append_dev(div17, t53);
    			append_dev(div17, input15);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
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
    			if (detaching) detach_dev(div18);
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

    function HexToRGB(hex) {
    	let r = parseInt(hex.slice(1, 3), 16);
    	let g = parseInt(hex.slice(3, 5), 16);
    	let b = parseInt(hex.slice(5, 7), 16);
    	return `${r} ${g} ${b}`;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ HexToRGB });
    	return [$$scope, slots];
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

    /* src/ui/misc/Credits.svelte generated by Svelte v3.47.0 */

    const file$1 = "src/ui/misc/Credits.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let t0;
    	let img;
    	let img_src_value;
    	let br0;
    	let t1;
    	let a0;
    	let br1;
    	let t3;
    	let a1;
    	let br2;
    	let t5;
    	let a2;
    	let br3;
    	let br4;
    	let t7;
    	let a3;
    	let t9;
    	let a4;
    	let t11;
    	let a5;
    	let br5;
    	let br6;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			img = element("img");
    			br0 = element("br");
    			t1 = text("\n\n\tadocubes by ");
    			a0 = element("a");
    			a0.textContent = "Ado1928";
    			br1 = element("br");
    			t3 = text("\n\tBack-End developer - ");
    			a1 = element("a");
    			a1.textContent = "ifritdiezel";
    			br2 = element("br");
    			t5 = text("\n\tFront-End developer - ");
    			a2 = element("a");
    			a2.textContent = "macimas";
    			br3 = element("br");
    			br4 = element("br");
    			t7 = text("\n\n\tMade with ");
    			a3 = element("a");
    			a3.textContent = "Node.js";
    			t9 = text(", ");
    			a4 = element("a");
    			a4.textContent = "Three.js";
    			t11 = text(", and ");
    			a5 = element("a");
    			a5.textContent = "Svelte";
    			br5 = element("br");
    			br6 = element("br");
    			if (!src_url_equal(img.src, img_src_value = "./images/logo/adocubes.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "adocubes");
    			attr_dev(img, "target", "_blank");
    			attr_dev(img, "rel", "noopener noreferrer");
    			add_location(img, file$1, 3, 1, 56);
    			add_location(br0, file$1, 3, 96, 151);
    			attr_dev(a0, "href", "https://github.com/ado1928");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$1, 5, 13, 170);
    			add_location(br1, file$1, 5, 103, 260);
    			attr_dev(a1, "href", "https://github.com/ifritdiezel");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$1, 6, 22, 287);
    			add_location(br2, file$1, 6, 120, 385);
    			attr_dev(a2, "href", "https://github.com/macimas");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "rel", "noopener noreferrer");
    			add_location(a2, file$1, 7, 23, 413);
    			add_location(br3, file$1, 7, 113, 503);
    			add_location(br4, file$1, 7, 117, 507);
    			attr_dev(a3, "href", "https://nodejs.org");
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "rel", "noopener noreferrer");
    			add_location(a3, file$1, 9, 11, 524);
    			attr_dev(a4, "href", "https://threejs.org");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "rel", "noopener noreferrer");
    			add_location(a4, file$1, 9, 95, 608);
    			attr_dev(a5, "href", "https://svelte.dev");
    			attr_dev(a5, "target", "_blank");
    			attr_dev(a5, "rel", "noopener noreferrer");
    			add_location(a5, file$1, 9, 185, 698);
    			add_location(br5, file$1, 9, 266, 779);
    			add_location(br6, file$1, 9, 270, 783);
    			attr_dev(div, "id", "winCredits");
    			attr_dev(div, "class", "box win center");
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, img);
    			append_dev(div, br0);
    			append_dev(div, t1);
    			append_dev(div, a0);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, a1);
    			append_dev(div, br2);
    			append_dev(div, t5);
    			append_dev(div, a2);
    			append_dev(div, br3);
    			append_dev(div, br4);
    			append_dev(div, t7);
    			append_dev(div, a3);
    			append_dev(div, t9);
    			append_dev(div, a4);
    			append_dev(div, t11);
    			append_dev(div, a5);
    			append_dev(div, br5);
    			append_dev(div, br6);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Credits', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Credits> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
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

    /* src/App.svelte generated by Svelte v3.47.0 */
    const file = "src/App.svelte";

    // (30:10) <EscWinNavs>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Controls");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(30:10) <EscWinNavs>",
    		ctx
    	});

    	return block;
    }

    // (30:0) <Controls>
    function create_default_slot_4(ctx) {
    	let escwinnavs;
    	let current;

    	escwinnavs = new EscWinNavs({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(escwinnavs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(escwinnavs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const escwinnavs_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				escwinnavs_changes.$$scope = { dirty, ctx };
    			}

    			escwinnavs.$set(escwinnavs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(escwinnavs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(escwinnavs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(escwinnavs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(30:0) <Controls>",
    		ctx
    	});

    	return block;
    }

    // (31:10) <EscWinNavs>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Settings");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(31:10) <EscWinNavs>",
    		ctx
    	});

    	return block;
    }

    // (31:0) <Settings>
    function create_default_slot_2(ctx) {
    	let escwinnavs;
    	let current;

    	escwinnavs = new EscWinNavs({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(escwinnavs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(escwinnavs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const escwinnavs_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				escwinnavs_changes.$$scope = { dirty, ctx };
    			}

    			escwinnavs.$set(escwinnavs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(escwinnavs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(escwinnavs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(escwinnavs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(31:0) <Settings>",
    		ctx
    	});

    	return block;
    }

    // (32:9) <EscWinNavs>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Credits");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(32:9) <EscWinNavs>",
    		ctx
    	});

    	return block;
    }

    // (32:0) <Credits>
    function create_default_slot(ctx) {
    	let escwinnavs;
    	let current;

    	escwinnavs = new EscWinNavs({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(escwinnavs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(escwinnavs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const escwinnavs_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				escwinnavs_changes.$$scope = { dirty, ctx };
    			}

    			escwinnavs.$set(escwinnavs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(escwinnavs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(escwinnavs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(escwinnavs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(32:0) <Credits>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let welcome;
    	let t0;
    	let div1;
    	let div0;
    	let switchplacement;
    	let t1;
    	let palette;
    	let t2;
    	let coordinates;
    	let t3;
    	let chat;
    	let t4;
    	let img;
    	let img_src_value;
    	let t5;
    	let esc;
    	let t6;
    	let controls;
    	let t7;
    	let settings;
    	let t8;
    	let credits;
    	let current;
    	welcome = new Welcome({ $$inline: true });
    	switchplacement = new SwitchPlacement({ $$inline: true });
    	palette = new Palette({ $$inline: true });
    	coordinates = new Coordinates({ $$inline: true });
    	chat = new Chat({ $$inline: true });
    	esc = new Esc({ $$inline: true });

    	controls = new Controls({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	settings = new Settings({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	credits = new Credits({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(welcome.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(switchplacement.$$.fragment);
    			t1 = space();
    			create_component(palette.$$.fragment);
    			t2 = space();
    			create_component(coordinates.$$.fragment);
    			t3 = space();
    			create_component(chat.$$.fragment);
    			t4 = space();
    			img = element("img");
    			t5 = space();
    			create_component(esc.$$.fragment);
    			t6 = space();
    			create_component(controls.$$.fragment);
    			t7 = space();
    			create_component(settings.$$.fragment);
    			t8 = space();
    			create_component(credits.$$.fragment);
    			attr_dev(div0, "id", "itsEditTime");
    			add_location(div0, file, 19, 1, 585);
    			attr_dev(img, "id", "crosshair");
    			attr_dev(img, "class", "center");
    			if (!src_url_equal(img.src, img_src_value = "./images/svgs/crosshair.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "+");
    			add_location(img, file, 25, 1, 676);
    			attr_dev(div1, "id", "uiCanvas");
    			add_location(div1, file, 17, 0, 548);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(welcome, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(switchplacement, div0, null);
    			append_dev(div0, t1);
    			mount_component(palette, div0, null);
    			append_dev(div1, t2);
    			mount_component(coordinates, div1, null);
    			append_dev(div1, t3);
    			mount_component(chat, div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, img);
    			insert_dev(target, t5, anchor);
    			mount_component(esc, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(controls, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(settings, target, anchor);
    			insert_dev(target, t8, anchor);
    			mount_component(credits, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const controls_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				controls_changes.$$scope = { dirty, ctx };
    			}

    			controls.$set(controls_changes);
    			const settings_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				settings_changes.$$scope = { dirty, ctx };
    			}

    			settings.$set(settings_changes);
    			const credits_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				credits_changes.$$scope = { dirty, ctx };
    			}

    			credits.$set(credits_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(welcome.$$.fragment, local);
    			transition_in(switchplacement.$$.fragment, local);
    			transition_in(palette.$$.fragment, local);
    			transition_in(coordinates.$$.fragment, local);
    			transition_in(chat.$$.fragment, local);
    			transition_in(esc.$$.fragment, local);
    			transition_in(controls.$$.fragment, local);
    			transition_in(settings.$$.fragment, local);
    			transition_in(credits.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(welcome.$$.fragment, local);
    			transition_out(switchplacement.$$.fragment, local);
    			transition_out(palette.$$.fragment, local);
    			transition_out(coordinates.$$.fragment, local);
    			transition_out(chat.$$.fragment, local);
    			transition_out(esc.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
    			transition_out(settings.$$.fragment, local);
    			transition_out(credits.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(welcome, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(switchplacement);
    			destroy_component(palette);
    			destroy_component(coordinates);
    			destroy_component(chat);
    			if (detaching) detach_dev(t5);
    			destroy_component(esc, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(controls, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(settings, detaching);
    			if (detaching) detach_dev(t8);
    			destroy_component(credits, detaching);
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
    		Coordinates,
    		SwitchPlacement,
    		Chat,
    		Esc,
    		EscWinNavs,
    		Welcome,
    		Controls,
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

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world',
    	},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
