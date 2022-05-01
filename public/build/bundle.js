
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
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
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

    /* src/ui/canvas/Palette.svelte generated by Svelte v3.47.0 */

    const file$9 = "src/ui/canvas/Palette.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(div0, file$9, 1, 1, 32);
    			set_style(div1, "background", "#AAAAAA");
    			add_location(div1, file$9, 2, 1, 68);
    			set_style(div2, "background", "#888888");
    			add_location(div2, file$9, 3, 1, 104);
    			set_style(div3, "background", "#484848");
    			add_location(div3, file$9, 4, 1, 140);
    			set_style(div4, "background", "#000000");
    			add_location(div4, file$9, 5, 1, 176);
    			set_style(div5, "background", "#991609");
    			add_location(div5, file$9, 6, 1, 212);
    			set_style(div6, "background", "#DF250B");
    			add_location(div6, file$9, 7, 1, 248);
    			set_style(div7, "background", "#FF5610");
    			add_location(div7, file$9, 8, 1, 284);
    			set_style(div8, "background", "#FF832A");
    			add_location(div8, file$9, 9, 1, 320);
    			set_style(div9, "background", "#FFB885");
    			add_location(div9, file$9, 10, 1, 356);
    			set_style(div10, "background", "#936100");
    			add_location(div10, file$9, 11, 1, 392);
    			set_style(div11, "background", "#E29705");
    			add_location(div11, file$9, 12, 1, 428);
    			set_style(div12, "background", "#FFD223");
    			add_location(div12, file$9, 13, 1, 464);
    			set_style(div13, "background", "#FFF7AF");
    			add_location(div13, file$9, 14, 1, 500);
    			set_style(div14, "background", "#47561E");
    			add_location(div14, file$9, 15, 1, 536);
    			set_style(div15, "background", "#71892B");
    			add_location(div15, file$9, 16, 1, 572);
    			set_style(div16, "background", "#94BE1A");
    			add_location(div16, file$9, 17, 1, 608);
    			set_style(div17, "background", "#DCFF77");
    			add_location(div17, file$9, 18, 1, 644);
    			set_style(div18, "background", "#124B36");
    			add_location(div18, file$9, 19, 1, 680);
    			set_style(div19, "background", "#0F8158");
    			add_location(div19, file$9, 20, 1, 716);
    			set_style(div20, "background", "#03C07C");
    			add_location(div20, file$9, 21, 1, 752);
    			set_style(div21, "background", "#90FFCA");
    			add_location(div21, file$9, 22, 1, 788);
    			set_style(div22, "background", "#024851");
    			add_location(div22, file$9, 23, 1, 824);
    			set_style(div23, "background", "#0D7A89");
    			add_location(div23, file$9, 24, 1, 860);
    			set_style(div24, "background", "#01A6BD");
    			add_location(div24, file$9, 25, 1, 896);
    			set_style(div25, "background", "#34E7FF");
    			add_location(div25, file$9, 26, 1, 932);
    			set_style(div26, "background", "#013462");
    			add_location(div26, file$9, 27, 1, 968);
    			set_style(div27, "background", "#0D569A");
    			add_location(div27, file$9, 28, 1, 1004);
    			set_style(div28, "background", "#066ECE");
    			add_location(div28, file$9, 29, 1, 1040);
    			set_style(div29, "background", "#4CA9FF");
    			add_location(div29, file$9, 30, 1, 1076);
    			set_style(div30, "background", "#181691");
    			add_location(div30, file$9, 31, 1, 1112);
    			set_style(div31, "background", "#2A25F5");
    			add_location(div31, file$9, 32, 1, 1148);
    			set_style(div32, "background", "#4E55FF");
    			add_location(div32, file$9, 33, 1, 1184);
    			set_style(div33, "background", "#9DB8FF");
    			add_location(div33, file$9, 34, 1, 1220);
    			set_style(div34, "background", "#58196B");
    			add_location(div34, file$9, 35, 1, 1256);
    			set_style(div35, "background", "#AC01E0");
    			add_location(div35, file$9, 36, 1, 1292);
    			set_style(div36, "background", "#C82EF7");
    			add_location(div36, file$9, 37, 1, 1328);
    			set_style(div37, "background", "#DC91FF");
    			add_location(div37, file$9, 38, 1, 1364);
    			set_style(div38, "background", "#650036");
    			add_location(div38, file$9, 39, 1, 1400);
    			set_style(div39, "background", "#B0114B");
    			add_location(div39, file$9, 40, 1, 1436);
    			set_style(div40, "background", "#EA3477");
    			add_location(div40, file$9, 41, 1, 1472);
    			set_style(div41, "background", "#FF95BC");
    			add_location(div41, file$9, 42, 1, 1508);
    			set_style(div42, "background", "#62071D");
    			add_location(div42, file$9, 43, 1, 1544);
    			set_style(div43, "background", "#9B0834");
    			add_location(div43, file$9, 44, 1, 1580);
    			set_style(div44, "background", "#CB003D");
    			add_location(div44, file$9, 45, 1, 1616);
    			set_style(div45, "background", "#FF7384");
    			add_location(div45, file$9, 46, 1, 1652);
    			set_style(div46, "background", "#49230A");
    			add_location(div46, file$9, 47, 1, 1688);
    			set_style(div47, "background", "#814A17");
    			add_location(div47, file$9, 48, 1, 1724);
    			set_style(div48, "background", "#D17A2B");
    			add_location(div48, file$9, 49, 1, 1760);
    			set_style(div49, "background", "#FFB470");
    			add_location(div49, file$9, 50, 1, 1796);
    			attr_dev(div50, "id", "palette");
    			attr_dev(div50, "class", "box");
    			add_location(div50, file$9, 0, 0, 0);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Palette",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/ui/canvas/Coordinates.svelte generated by Svelte v3.47.0 */

    const file$8 = "src/ui/canvas/Coordinates.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "x: 0, y: 0, z:0";
    			attr_dev(div0, "id", "coords");
    			add_location(div0, file$8, 1, 1, 36);
    			attr_dev(div1, "id", "coordinates");
    			attr_dev(div1, "class", "box");
    			add_location(div1, file$8, 0, 0, 0);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Coordinates",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/ui/canvas/SwitchPlacement.svelte generated by Svelte v3.47.0 */

    const file$7 = "src/ui/canvas/SwitchPlacement.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(img0, file$7, 6, 68, 181);
    			attr_dev(button0, "id", "placeAtRaycast");
    			attr_dev(button0, "class", "icon");
    			add_location(button0, file$7, 6, 1, 114);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/place in camera.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "place in camera");
    			add_location(img1, file$7, 7, 66, 327);
    			attr_dev(button1, "id", "placeInCamera");
    			attr_dev(button1, "class", "icon");
    			add_location(button1, file$7, 7, 1, 262);
    			attr_dev(div, "id", "switchPlacement");
    			attr_dev(div, "class", "box");
    			add_location(div, file$7, 5, 0, 74);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { placeAtRaycast: 0, placeInCamera: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SwitchPlacement",
    			options,
    			id: create_fragment$7.name
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

    const file$6 = "src/ui/canvas/Chat.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(div0, file$6, 1, 1, 29);
    			attr_dev(input, "id", "inputChat");
    			attr_dev(input, "type", "text");
    			set_style(input, "margin-bottom", "0");
    			set_style(input, "margin-top", "var(--box-padding)");
    			add_location(input, file$6, 3, 1, 58);
    			attr_dev(div1, "id", "chat");
    			attr_dev(div1, "class", "box");
    			add_location(div1, file$6, 0, 0, 0);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chat",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/ui/esc/Esc.svelte generated by Svelte v3.47.0 */

    const file$5 = "src/ui/esc/Esc.svelte";

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
    			button1.textContent = "Credits";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Settings";
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
    			add_location(button0, file$5, 26, 2, 636);
    			attr_dev(button1, "id", "escCredits");
    			add_location(button1, file$5, 27, 2, 698);
    			attr_dev(button2, "id", "escSettings");
    			add_location(button2, file$5, 28, 2, 763);
    			add_location(br, file$5, 30, 2, 832);
    			attr_dev(a0, "href", "https://github.com/ado1928/ado-cubes");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$5, 33, 3, 901);
    			attr_dev(a1, "href", "https://discord.gg/rNMTeADfnc");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$5, 33, 118, 1016);
    			set_style(div0, "display", "flex");
    			set_style(div0, "flex-direction", "row");
    			set_style(div0, "width", "auto");
    			add_location(div0, file$5, 32, 2, 840);
    			attr_dev(div1, "id", "escMenu");
    			attr_dev(div1, "class", "box center");
    			add_location(div1, file$5, 25, 1, 596);
    			attr_dev(div2, "id", "esc");
    			add_location(div2, file$5, 24, 0, 580);
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
    					listen_dev(button1, "click", escCredits, false, false, false),
    					listen_dev(button2, "click", escSettings, false, false, false)
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

    function escCredits() {
    	esc.style.display = "none";
    	winCredits.style.display = "block";
    }

    function escSettings() {
    	esc.style.display = "none";
    	winSettings.style.display = "block";
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Esc', slots, []);

    	document.onkeydown = function (e) {
    		if (e.key === "Escape" && document.activeElement.tagName !== "INPUT") {
    			esc.style.display = esc.style.display == "block" ? "none" : "block";
    			winCredits.style.display = "none";
    			winSettings.style.display = "none";
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Esc> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ escReturn, escCredits, escSettings });
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

    /* src/ui/esc/EscWinNavs.svelte generated by Svelte v3.47.0 */

    const file$4 = "src/ui/esc/EscWinNavs.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let h2;
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
    			h2 = element("h2");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			button1 = element("button");
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "./images/icons/left arrow.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "<=");
    			add_location(img0, file$4, 13, 43, 381);
    			attr_dev(button0, "class", "iconav");
    			add_location(button0, file$4, 13, 1, 339);
    			set_style(h2, "margin", "0");
    			add_location(h2, file$4, 14, 1, 442);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/exit.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "X");
    			add_location(img1, file$4, 15, 43, 520);
    			attr_dev(button1, "class", "iconav");
    			add_location(button1, file$4, 15, 1, 478);
    			set_style(div, "display", "flex");
    			set_style(div, "justify-content", "space-between");
    			set_style(div, "align-items", "center");
    			set_style(div, "padding", "4px 4px");
    			set_style(div, "margin-bottom", "12px");
    			add_location(div, file$4, 12, 0, 226);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, img0);
    			append_dev(div, t0);
    			append_dev(div, h2);

    			if (default_slot) {
    				default_slot.m(h2, null);
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
    	winSettings.style.display = "none";
    	winControls.style.display = "none";
    	winCredits.style.display = "none";
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EscWinNavs",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/ui/misc/Welcome.svelte generated by Svelte v3.47.0 */

    const file$3 = "src/ui/misc/Welcome.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
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
    	let div1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
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
    			div1 = element("div");
    			attr_dev(img, "id", "welcomeLogo");
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "style", /*style*/ ctx[1]);
    			add_location(img, file$3, 28, 2, 955);
    			add_location(div0, file$3, 27, 1, 947);
    			add_location(br0, file$3, 30, 1, 1001);
    			add_location(br1, file$3, 30, 5, 1005);
    			attr_dev(input0, "id", "inputUsername");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$3, 31, 11, 1021);
    			add_location(br2, file$3, 31, 49, 1059);
    			attr_dev(input1, "id", "inputPassword");
    			attr_dev(input1, "type", "text");
    			input1.value = "this input does nothing for now. pls ignore";
    			add_location(input1, file$3, 32, 11, 1075);
    			add_location(br3, file$3, 32, 101, 1165);
    			add_location(br4, file$3, 33, 88, 1258);
    			add_location(br5, file$3, 33, 152, 1322);
    			attr_dev(p0, "id", "noNeedToVerify");
    			set_style(p0, "display", "none");
    			add_location(p0, file$3, 33, 1, 1171);
    			add_location(br6, file$3, 33, 160, 1330);
    			add_location(strong0, file$3, 35, 1, 1337);
    			add_location(br7, file$3, 35, 100, 1436);
    			add_location(br8, file$3, 35, 104, 1440);
    			add_location(strong1, file$3, 37, 1, 1447);
    			add_location(br9, file$3, 37, 61, 1507);
    			add_location(br10, file$3, 37, 134, 1580);
    			add_location(br11, file$3, 39, 45, 1673);
    			attr_dev(p1, "id", "captchaPlease");
    			set_style(p1, "display", "none");
    			add_location(p1, file$3, 39, 1, 1629);
    			attr_dev(div1, "class", "io-captcha");
    			attr_dev(div1, "data-pubkey", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO");
    			attr_dev(div1, "data-theme", "dark");
    			attr_dev(div1, "data-scale", "1.0");
    			attr_dev(div1, "data-font", "mono");
    			attr_dev(div1, "data-callback-solve", "solve");
    			attr_dev(div1, "data-widgetid", "iocaptcha");
    			add_location(div1, file$3, 40, 1, 1749);
    			attr_dev(div2, "id", "winWelcome");
    			attr_dev(div2, "class", "box win center");
    			set_style(div2, "top", "62%");
    			add_location(div2, file$3, 26, 0, 885);
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
    			append_dev(div2, t1);
    			append_dev(div2, input0);
    			append_dev(div2, br2);
    			append_dev(div2, t2);
    			append_dev(div2, input1);
    			append_dev(div2, br3);
    			append_dev(div2, t3);
    			append_dev(div2, p0);
    			append_dev(p0, t4);
    			append_dev(p0, br4);
    			append_dev(p0, t5);
    			append_dev(p0, br5);
    			append_dev(div2, br6);
    			append_dev(div2, t6);
    			append_dev(div2, strong0);
    			append_dev(div2, t8);
    			append_dev(div2, br7);
    			append_dev(div2, br8);
    			append_dev(div2, t9);
    			append_dev(div2, strong1);
    			append_dev(div2, t11);
    			append_dev(div2, br9);
    			append_dev(div2, t12);
    			append_dev(div2, br10);
    			append_dev(div2, t13);
    			append_dev(div2, p1);
    			append_dev(p1, br11);
    			append_dev(p1, t14);
    			append_dev(div2, t15);
    			append_dev(div2, div1);
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
    	let src = "./images/logo/adocubes-full.svg";
    	let style = "position:absolute;transform:translate(-50%, -174px);left:50%;pointer-events:none";

    	window.onload = function () {
    		// this is most likely some shitty code!
    		if (miscEnableRandomLogos.checked) {
    			if (Math.floor(Math.random() * 70) == 1) {
    				$$invalidate(0, src = "./images/logo/odacebus.svg");
    			} else if (Math.floor(Math.random() * 900) == 1) {
    				$$invalidate(0, src = "./images/logo/aaaaaaaa.svg");
    				let aaaaaaaa = new Audio('./audio/screaming.ogg');
    				aaaaaaaa.play();
    			} else if (Math.floor(Math.random() * 727) == 1) {
    				$$invalidate(0, src = "./images/logo/ado!.svg");
    				$$invalidate(1, style = "position:absolute;transform:translate(-50%, -164px);left:50%;pointer-events:none");
    				let ado = new Audio('./audio/welcome to ado.ogg');
    				ado.play();
    			} else {
    				let music = new Audio('./audio/music/The Moon.ogg');
    				music.play();
    			}
    		}
    	};

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

    /* src/ui/misc/Settings.svelte generated by Svelte v3.47.0 */
    const file$2 = "src/ui/misc/Settings.svelte";

    function create_fragment$2(ctx) {
    	let div21;
    	let t0;
    	let div20;
    	let h20;
    	let t2;
    	let img0;
    	let img0_src_value;
    	let t3;
    	let br;
    	let t4;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let h21;
    	let t7;
    	let div0;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let select0;
    	let option0;
    	let option1;
    	let t11;
    	let h22;
    	let t13;
    	let div1;
    	let img3;
    	let img3_src_value;
    	let t14;
    	let select1;
    	let option2;
    	let option3;
    	let option4;
    	let t18;
    	let div2;
    	let t19;
    	let input0;
    	let t20;
    	let div3;
    	let t21;
    	let input1;
    	let t22;
    	let div4;
    	let t23;
    	let input2;
    	let t24;
    	let div5;
    	let t25;
    	let input3;
    	let t26;
    	let div6;
    	let t27;
    	let input4;
    	let t28;
    	let div7;
    	let t29;
    	let input5;
    	let t30;
    	let h23;
    	let t32;
    	let div8;
    	let img4;
    	let img4_src_value;
    	let t33;
    	let t34;
    	let t35;
    	let input6;
    	let t36;
    	let div9;
    	let img5;
    	let img5_src_value;
    	let t37;
    	let t38;
    	let t39;
    	let input7;
    	let t40;
    	let div10;
    	let img6;
    	let img6_src_value;
    	let t41;
    	let t42;
    	let t43;
    	let input8;
    	let t44;
    	let div11;
    	let img7;
    	let img7_src_value;
    	let t45;
    	let t46;
    	let t47;
    	let input9;
    	let t48;
    	let div12;
    	let img8;
    	let img8_src_value;
    	let t49;
    	let input10;
    	let t50;
    	let div13;
    	let t51;
    	let input11;
    	let t52;
    	let div14;
    	let t53;
    	let input12;
    	let t54;
    	let h24;
    	let t56;
    	let div15;
    	let img9;
    	let img9_src_value;
    	let t57;
    	let input13;
    	let t58;
    	let h25;
    	let t60;
    	let div16;
    	let img10;
    	let img10_src_value;
    	let t61;
    	let input14;
    	let t62;
    	let h26;
    	let t64;
    	let div17;
    	let strong;
    	let t66;
    	let t67;
    	let div18;
    	let t68;
    	let input15;
    	let t69;
    	let div19;
    	let t70;
    	let input16;
    	let t71;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			div21 = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div20 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Legend";
    			t2 = space();
    			img0 = element("img");
    			t3 = text(" - Not functional");
    			br = element("br");
    			t4 = space();
    			img1 = element("img");
    			t5 = text(" - Requires refresh\n\n\t\t");
    			h21 = element("h2");
    			h21.textContent = "General";
    			t7 = space();
    			div0 = element("div");
    			img2 = element("img");
    			t8 = text(" Language\n\t\t\t");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "English";
    			option1 = element("option");
    			option1.textContent = "Only English.";
    			t11 = space();
    			h22 = element("h2");
    			h22.textContent = "Input";
    			t13 = space();
    			div1 = element("div");
    			img3 = element("img");
    			t14 = text(" Movement\n\t\t\t");
    			select1 = element("select");
    			option2 = element("option");
    			option2.textContent = "WASD";
    			option3 = element("option");
    			option3.textContent = "Arrow keys";
    			option4 = element("option");
    			option4.textContent = "Custom";
    			t18 = space();
    			div2 = element("div");
    			t19 = text("Place cubes ");
    			input0 = element("input");
    			t20 = space();
    			div3 = element("div");
    			t21 = text("Remove cubes ");
    			input1 = element("input");
    			t22 = space();
    			div4 = element("div");
    			t23 = text("Toggle grid ");
    			input2 = element("input");
    			t24 = space();
    			div5 = element("div");
    			t25 = text("Palette row scroll ");
    			input3 = element("input");
    			t26 = space();
    			div6 = element("div");
    			t27 = text("Settings shortcut ");
    			input4 = element("input");
    			t28 = space();
    			div7 = element("div");
    			t29 = text("Disable mouse place and remove ");
    			input5 = element("input");
    			t30 = space();
    			h23 = element("h2");
    			h23.textContent = "Audio";
    			t32 = space();
    			div8 = element("div");
    			img4 = element("img");
    			t33 = text(" Master ");
    			t34 = text(/*audioMasterVolume*/ ctx[5]);
    			t35 = space();
    			input6 = element("input");
    			t36 = space();
    			div9 = element("div");
    			img5 = element("img");
    			t37 = text(" Music ");
    			t38 = text(/*audioMusicVolume*/ ctx[6]);
    			t39 = space();
    			input7 = element("input");
    			t40 = space();
    			div10 = element("div");
    			img6 = element("img");
    			t41 = text(" SFX ");
    			t42 = text(/*audioSfxVolume*/ ctx[7]);
    			t43 = space();
    			input8 = element("input");
    			t44 = space();
    			div11 = element("div");
    			img7 = element("img");
    			t45 = text(" UI ");
    			t46 = text(/*audioUiVolume*/ ctx[8]);
    			t47 = space();
    			input9 = element("input");
    			t48 = space();
    			div12 = element("div");
    			img8 = element("img");
    			t49 = text(" Enable music ");
    			input10 = element("input");
    			t50 = space();
    			div13 = element("div");
    			t51 = text("Disable place and remove sounds ");
    			input11 = element("input");
    			t52 = space();
    			div14 = element("div");
    			t53 = text("Disable UI sounds ");
    			input12 = element("input");
    			t54 = space();
    			h24 = element("h2");
    			h24.textContent = "Performance";
    			t56 = space();
    			div15 = element("div");
    			img9 = element("img");
    			t57 = text(" Enable clouds ");
    			input13 = element("input");
    			t58 = space();
    			h25 = element("h2");
    			h25.textContent = "Miscellaneous";
    			t60 = space();
    			div16 = element("div");
    			img10 = element("img");
    			t61 = text(" Enable random logos in welcome ");
    			input14 = element("input");
    			t62 = space();
    			h26 = element("h2");
    			h26.textContent = "Theme";
    			t64 = space();
    			div17 = element("div");
    			strong = element("strong");
    			strong.textContent = "NOTE:";
    			t66 = text(" Blur does not properly work in Firefox");
    			t67 = space();
    			div18 = element("div");
    			t68 = space();
    			input15 = element("input");
    			t69 = space();
    			div19 = element("div");
    			t70 = text("Disable text shadows ");
    			input16 = element("input");
    			t71 = space();
    			button = element("button");
    			button.textContent = "Apply";
    			set_style(h20, "margin", "0");
    			add_location(h20, file$2, 79, 2, 2278);
    			if (!src_url_equal(img0.src, img0_src_value = "./images/icons/not functional.svg")) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$2, 80, 2, 2313);
    			add_location(br, file$2, 80, 64, 2375);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/requires refresh.svg")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 81, 2, 2382);
    			add_location(h21, file$2, 83, 2, 2452);
    			if (!src_url_equal(img2.src, img2_src_value = "./images/icons/not functional.svg")) attr_dev(img2, "src", img2_src_value);
    			add_location(img2, file$2, 84, 7, 2476);
    			option0.__value = "english";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 86, 4, 2568);
    			option1.__value = "onlyEnglish";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 87, 4, 2613);
    			attr_dev(select0, "id", "generalLanguage");
    			add_location(select0, file$2, 85, 3, 2534);
    			add_location(div0, file$2, 84, 2, 2471);
    			add_location(h22, file$2, 91, 2, 2689);
    			if (!src_url_equal(img3.src, img3_src_value = "./images/icons/not functional.svg")) attr_dev(img3, "src", img3_src_value);
    			add_location(img3, file$2, 92, 7, 2711);
    			option2.__value = "wasd";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 94, 4, 2814);
    			option3.__value = "arrow";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 95, 4, 2853);
    			option4.__value = "custom";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 96, 4, 2899);
    			attr_dev(select1, "id", "inputMovement");
    			add_location(select1, file$2, 93, 3, 2769);
    			add_location(div1, file$2, 92, 2, 2706);
    			attr_dev(input0, "id", "inputPlaceCubes");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$2, 105, 19, 3175);
    			add_location(div2, file$2, 105, 2, 3158);
    			attr_dev(input1, "id", "inputRemoveCubes");
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$2, 106, 20, 3271);
    			add_location(div3, file$2, 106, 2, 3253);
    			attr_dev(input2, "id", "inputToggleGrid");
    			attr_dev(input2, "type", "text");
    			add_location(input2, file$2, 107, 19, 3368);
    			add_location(div4, file$2, 107, 2, 3351);
    			attr_dev(input3, "id", "inputPaletteRowScroll");
    			attr_dev(input3, "type", "text");
    			add_location(input3, file$2, 108, 26, 3470);
    			add_location(div5, file$2, 108, 2, 3446);
    			attr_dev(input4, "id", "inputSettingsShortcut");
    			attr_dev(input4, "type", "text");
    			add_location(input4, file$2, 109, 25, 3583);
    			add_location(div6, file$2, 109, 2, 3560);
    			attr_dev(input5, "id", "inputDisablePR");
    			attr_dev(input5, "type", "checkbox");
    			add_location(input5, file$2, 110, 38, 3709);
    			add_location(div7, file$2, 110, 2, 3673);
    			add_location(h23, file$2, 112, 2, 3762);
    			if (!src_url_equal(img4.src, img4_src_value = "./images/icons/not functional.svg")) attr_dev(img4, "src", img4_src_value);
    			add_location(img4, file$2, 113, 7, 3784);
    			attr_dev(input6, "id", "masterVolume");
    			attr_dev(input6, "class", "slider");
    			attr_dev(input6, "type", "range");
    			add_location(input6, file$2, 113, 80, 3857);
    			add_location(div8, file$2, 113, 2, 3779);
    			if (!src_url_equal(img5.src, img5_src_value = "./images/icons/not functional.svg")) attr_dev(img5, "src", img5_src_value);
    			add_location(img5, file$2, 114, 7, 3955);
    			attr_dev(input7, "id", "musicVolume");
    			attr_dev(input7, "class", "slider");
    			attr_dev(input7, "type", "range");
    			add_location(input7, file$2, 114, 78, 4026);
    			add_location(div9, file$2, 114, 2, 3950);
    			if (!src_url_equal(img6.src, img6_src_value = "./images/icons/not functional.svg")) attr_dev(img6, "src", img6_src_value);
    			add_location(img6, file$2, 115, 7, 4122);
    			attr_dev(input8, "id", "sfxVolume");
    			attr_dev(input8, "class", "slider");
    			attr_dev(input8, "type", "range");
    			add_location(input8, file$2, 115, 74, 4189);
    			add_location(div10, file$2, 115, 2, 4117);
    			if (!src_url_equal(img7.src, img7_src_value = "./images/icons/not functional.svg")) attr_dev(img7, "src", img7_src_value);
    			add_location(img7, file$2, 116, 7, 4281);
    			attr_dev(input9, "id", "uiVolume");
    			attr_dev(input9, "class", "slider");
    			attr_dev(input9, "type", "range");
    			add_location(input9, file$2, 116, 72, 4346);
    			add_location(div11, file$2, 116, 2, 4276);
    			if (!src_url_equal(img8.src, img8_src_value = "./images/icons/requires refresh.svg")) attr_dev(img8, "src", img8_src_value);
    			add_location(img8, file$2, 118, 7, 4437);
    			attr_dev(input10, "id", "audioEnableMusic");
    			attr_dev(input10, "type", "checkbox");
    			add_location(input10, file$2, 118, 68, 4498);
    			add_location(div12, file$2, 118, 2, 4432);
    			attr_dev(input11, "id", "audioDisablePR");
    			attr_dev(input11, "type", "checkbox");
    			add_location(input11, file$2, 119, 39, 4589);
    			add_location(div13, file$2, 119, 2, 4552);
    			attr_dev(input12, "id", "audioDisableUI");
    			attr_dev(input12, "type", "checkbox");
    			add_location(input12, file$2, 120, 25, 4664);
    			add_location(div14, file$2, 120, 2, 4641);
    			add_location(h24, file$2, 122, 2, 4717);
    			if (!src_url_equal(img9.src, img9_src_value = "./images/icons/not functional.svg")) attr_dev(img9, "src", img9_src_value);
    			add_location(img9, file$2, 123, 7, 4745);
    			attr_dev(input13, "id", "prfmEnableClouds");
    			attr_dev(input13, "type", "checkbox");
    			add_location(input13, file$2, 123, 67, 4805);
    			add_location(div15, file$2, 123, 2, 4740);
    			add_location(h25, file$2, 125, 2, 4860);
    			if (!src_url_equal(img10.src, img10_src_value = "./images/icons/requires refresh.svg")) attr_dev(img10, "src", img10_src_value);
    			add_location(img10, file$2, 126, 7, 4890);
    			attr_dev(input14, "id", "miscEnableRandomLogos");
    			attr_dev(input14, "type", "checkbox");
    			add_location(input14, file$2, 126, 86, 4969);
    			add_location(div16, file$2, 126, 2, 4885);
    			add_location(h26, file$2, 128, 2, 5029);
    			add_location(strong, file$2, 129, 7, 5051);
    			add_location(div17, file$2, 129, 2, 5046);
    			set_style(div18, "background", "#000");
    			set_style(div18, "height", "130px");
    			set_style(div18, "width", "-moz-available");
    			set_style(div18, "width", "-webkit-fill-available");
    			add_location(div18, file$2, 130, 2, 5121);
    			attr_dev(input15, "type", "file");
    			add_location(input15, file$2, 131, 2, 5222);
    			attr_dev(input16, "id", "themeDisableTextShadows");
    			attr_dev(input16, "type", "checkbox");
    			add_location(input16, file$2, 132, 28, 5270);
    			add_location(div19, file$2, 132, 2, 5244);
    			set_style(div20, "overflow-y", "scroll");
    			set_style(div20, "height", "80%");
    			add_location(div20, file$2, 78, 1, 2232);
    			attr_dev(button, "id", "applySettings");
    			add_location(button, file$2, 134, 1, 5338);
    			attr_dev(div21, "id", "winSettings");
    			attr_dev(div21, "class", "box win center");
    			add_location(div21, file$2, 76, 0, 2176);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div21, anchor);

    			if (default_slot) {
    				default_slot.m(div21, null);
    			}

    			append_dev(div21, t0);
    			append_dev(div21, div20);
    			append_dev(div20, h20);
    			append_dev(div20, t2);
    			append_dev(div20, img0);
    			append_dev(div20, t3);
    			append_dev(div20, br);
    			append_dev(div20, t4);
    			append_dev(div20, img1);
    			append_dev(div20, t5);
    			append_dev(div20, h21);
    			append_dev(div20, t7);
    			append_dev(div20, div0);
    			append_dev(div0, img2);
    			append_dev(div0, t8);
    			append_dev(div0, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(div20, t11);
    			append_dev(div20, h22);
    			append_dev(div20, t13);
    			append_dev(div20, div1);
    			append_dev(div1, img3);
    			append_dev(div1, t14);
    			append_dev(div1, select1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, "wasd");
    			append_dev(div20, t18);
    			append_dev(div20, div2);
    			append_dev(div2, t19);
    			append_dev(div2, input0);
    			set_input_value(input0, /*inputPlaceCubes*/ ctx[0]);
    			append_dev(div20, t20);
    			append_dev(div20, div3);
    			append_dev(div3, t21);
    			append_dev(div3, input1);
    			set_input_value(input1, /*inputRemoveCubes*/ ctx[1]);
    			append_dev(div20, t22);
    			append_dev(div20, div4);
    			append_dev(div4, t23);
    			append_dev(div4, input2);
    			set_input_value(input2, /*inputToggleGrid*/ ctx[2]);
    			append_dev(div20, t24);
    			append_dev(div20, div5);
    			append_dev(div5, t25);
    			append_dev(div5, input3);
    			set_input_value(input3, /*inputPaletteRowScroll*/ ctx[3]);
    			append_dev(div20, t26);
    			append_dev(div20, div6);
    			append_dev(div6, t27);
    			append_dev(div6, input4);
    			set_input_value(input4, /*inputSettingsShortcut*/ ctx[4]);
    			append_dev(div20, t28);
    			append_dev(div20, div7);
    			append_dev(div7, t29);
    			append_dev(div7, input5);
    			append_dev(div20, t30);
    			append_dev(div20, h23);
    			append_dev(div20, t32);
    			append_dev(div20, div8);
    			append_dev(div8, img4);
    			append_dev(div8, t33);
    			append_dev(div8, t34);
    			append_dev(div8, t35);
    			append_dev(div8, input6);
    			set_input_value(input6, /*audioMasterVolume*/ ctx[5]);
    			append_dev(div20, t36);
    			append_dev(div20, div9);
    			append_dev(div9, img5);
    			append_dev(div9, t37);
    			append_dev(div9, t38);
    			append_dev(div9, t39);
    			append_dev(div9, input7);
    			set_input_value(input7, /*audioMusicVolume*/ ctx[6]);
    			append_dev(div20, t40);
    			append_dev(div20, div10);
    			append_dev(div10, img6);
    			append_dev(div10, t41);
    			append_dev(div10, t42);
    			append_dev(div10, t43);
    			append_dev(div10, input8);
    			set_input_value(input8, /*audioSfxVolume*/ ctx[7]);
    			append_dev(div20, t44);
    			append_dev(div20, div11);
    			append_dev(div11, img7);
    			append_dev(div11, t45);
    			append_dev(div11, t46);
    			append_dev(div11, t47);
    			append_dev(div11, input9);
    			set_input_value(input9, /*audioUiVolume*/ ctx[8]);
    			append_dev(div20, t48);
    			append_dev(div20, div12);
    			append_dev(div12, img8);
    			append_dev(div12, t49);
    			append_dev(div12, input10);
    			append_dev(div20, t50);
    			append_dev(div20, div13);
    			append_dev(div13, t51);
    			append_dev(div13, input11);
    			append_dev(div20, t52);
    			append_dev(div20, div14);
    			append_dev(div14, t53);
    			append_dev(div14, input12);
    			append_dev(div20, t54);
    			append_dev(div20, h24);
    			append_dev(div20, t56);
    			append_dev(div20, div15);
    			append_dev(div15, img9);
    			append_dev(div15, t57);
    			append_dev(div15, input13);
    			append_dev(div20, t58);
    			append_dev(div20, h25);
    			append_dev(div20, t60);
    			append_dev(div20, div16);
    			append_dev(div16, img10);
    			append_dev(div16, t61);
    			append_dev(div16, input14);
    			append_dev(div20, t62);
    			append_dev(div20, h26);
    			append_dev(div20, t64);
    			append_dev(div20, div17);
    			append_dev(div17, strong);
    			append_dev(div17, t66);
    			append_dev(div20, t67);
    			append_dev(div20, div18);
    			append_dev(div20, t68);
    			append_dev(div20, input15);
    			append_dev(div20, t69);
    			append_dev(div20, div19);
    			append_dev(div19, t70);
    			append_dev(div19, input16);
    			append_dev(div21, t71);
    			append_dev(div21, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[14]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[15]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[16]),
    					listen_dev(input6, "change", /*input6_change_input_handler*/ ctx[17]),
    					listen_dev(input6, "input", /*input6_change_input_handler*/ ctx[17]),
    					listen_dev(input7, "change", /*input7_change_input_handler*/ ctx[18]),
    					listen_dev(input7, "input", /*input7_change_input_handler*/ ctx[18]),
    					listen_dev(input8, "change", /*input8_change_input_handler*/ ctx[19]),
    					listen_dev(input8, "input", /*input8_change_input_handler*/ ctx[19]),
    					listen_dev(input9, "change", /*input9_change_input_handler*/ ctx[20]),
    					listen_dev(input9, "input", /*input9_change_input_handler*/ ctx[20]),
    					listen_dev(button, "click", /*applySettings*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*inputPlaceCubes*/ 1 && input0.value !== /*inputPlaceCubes*/ ctx[0]) {
    				set_input_value(input0, /*inputPlaceCubes*/ ctx[0]);
    			}

    			if (dirty & /*inputRemoveCubes*/ 2 && input1.value !== /*inputRemoveCubes*/ ctx[1]) {
    				set_input_value(input1, /*inputRemoveCubes*/ ctx[1]);
    			}

    			if (dirty & /*inputToggleGrid*/ 4 && input2.value !== /*inputToggleGrid*/ ctx[2]) {
    				set_input_value(input2, /*inputToggleGrid*/ ctx[2]);
    			}

    			if (dirty & /*inputPaletteRowScroll*/ 8 && input3.value !== /*inputPaletteRowScroll*/ ctx[3]) {
    				set_input_value(input3, /*inputPaletteRowScroll*/ ctx[3]);
    			}

    			if (dirty & /*inputSettingsShortcut*/ 16 && input4.value !== /*inputSettingsShortcut*/ ctx[4]) {
    				set_input_value(input4, /*inputSettingsShortcut*/ ctx[4]);
    			}

    			if (!current || dirty & /*audioMasterVolume*/ 32) set_data_dev(t34, /*audioMasterVolume*/ ctx[5]);

    			if (dirty & /*audioMasterVolume*/ 32) {
    				set_input_value(input6, /*audioMasterVolume*/ ctx[5]);
    			}

    			if (!current || dirty & /*audioMusicVolume*/ 64) set_data_dev(t38, /*audioMusicVolume*/ ctx[6]);

    			if (dirty & /*audioMusicVolume*/ 64) {
    				set_input_value(input7, /*audioMusicVolume*/ ctx[6]);
    			}

    			if (!current || dirty & /*audioSfxVolume*/ 128) set_data_dev(t42, /*audioSfxVolume*/ ctx[7]);

    			if (dirty & /*audioSfxVolume*/ 128) {
    				set_input_value(input8, /*audioSfxVolume*/ ctx[7]);
    			}

    			if (!current || dirty & /*audioUiVolume*/ 256) set_data_dev(t46, /*audioUiVolume*/ ctx[8]);

    			if (dirty & /*audioUiVolume*/ 256) {
    				set_input_value(input9, /*audioUiVolume*/ ctx[8]);
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
    			if (detaching) detach_dev(div21);
    			if (default_slot) default_slot.d(detaching);
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

    function HexToRGB(hex) {
    	let r = parseInt(hex.slice(1, 3), 16);
    	let g = parseInt(hex.slice(3, 5), 16);
    	let b = parseInt(hex.slice(5, 7), 16);
    	return `${r} ${g} ${b}`;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, ['default']);

    	onMount(async () => {
    		function loadSettings() {
    			let pref = JSON.parse(localStorage.getItem('settings'));
    			$$invalidate(0, inputPlaceCubes = pref.inputPlaceCubes);
    			$$invalidate(1, inputRemoveCubes = pref.inputRemoveCubes);
    			$$invalidate(2, inputToggleGrid = pref.inputToggleGrid);
    			$$invalidate(3, inputPaletteRowScroll = pref.inputPaletteRowScroll);
    			$$invalidate(4, inputSettingsShortcut = pref.inputSettingsShortcut);
    			inputDisablePR.checked = pref.inputDisablePR;
    			$$invalidate(5, audioMasterVolume = pref.audioMasterVolume);
    			$$invalidate(6, audioMusicVolume = pref.audioMusicVolume);
    			$$invalidate(7, audioSfxVolume = pref.audioSfxVolume);
    			$$invalidate(8, audioUiVolume = pref.audioUiVolume);
    			audioEnableMusic.checked = pref.audioEnableMusic;
    			audioDisablePR.checked = pref.audioDisablePR;
    			miscEnableRandomLogos.checked = pref.miscEnableRandomLogos;
    			themeDisableTextShadows.checked = pref.themeDisableTextShadows;
    		}
    		loadSettings();
    	});

    	let inputPlaceCubes = "KeyX";
    	let inputRemoveCubes = "KeyC";
    	let inputToggleGrid = "KeyG";
    	let inputPaletteRowScroll = "AltLeft";
    	let inputSettingsShortcut = "KeyL";
    	let audioMasterVolume = 100;
    	let audioMusicVolume = 100;
    	let audioSfxVolume = 100;
    	let audioUiVolume = 100;

    	function applySettings() {
    		const storeSettings = {
    			inputPlaceCubes,
    			inputRemoveCubes,
    			inputToggleGrid,
    			inputPaletteRowScroll,
    			inputSettingsShortcut,
    			inputDisablePR: inputDisablePR.checked,
    			audioMasterVolume,
    			audioMusicVolume,
    			audioSfxVolume,
    			audioUiVolume,
    			audioEnableMusic: audioEnableMusic.checked,
    			audioDisablePR: audioDisablePR.checked,
    			miscEnableRandomLogos: miscEnableRandomLogos.checked,
    			themeDisableTextShadows: themeDisableTextShadows.checked
    		};

    		localStorage.setItem('settings', JSON.stringify(storeSettings));

    		window.onload = function () {
    			loadSettings();
    		};
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		inputPlaceCubes = this.value;
    		$$invalidate(0, inputPlaceCubes);
    	}

    	function input1_input_handler() {
    		inputRemoveCubes = this.value;
    		$$invalidate(1, inputRemoveCubes);
    	}

    	function input2_input_handler() {
    		inputToggleGrid = this.value;
    		$$invalidate(2, inputToggleGrid);
    	}

    	function input3_input_handler() {
    		inputPaletteRowScroll = this.value;
    		$$invalidate(3, inputPaletteRowScroll);
    	}

    	function input4_input_handler() {
    		inputSettingsShortcut = this.value;
    		$$invalidate(4, inputSettingsShortcut);
    	}

    	function input6_change_input_handler() {
    		audioMasterVolume = to_number(this.value);
    		$$invalidate(5, audioMasterVolume);
    	}

    	function input7_change_input_handler() {
    		audioMusicVolume = to_number(this.value);
    		$$invalidate(6, audioMusicVolume);
    	}

    	function input8_change_input_handler() {
    		audioSfxVolume = to_number(this.value);
    		$$invalidate(7, audioSfxVolume);
    	}

    	function input9_change_input_handler() {
    		audioUiVolume = to_number(this.value);
    		$$invalidate(8, audioUiVolume);
    	}

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		HexToRGB,
    		inputPlaceCubes,
    		inputRemoveCubes,
    		inputToggleGrid,
    		inputPaletteRowScroll,
    		inputSettingsShortcut,
    		audioMasterVolume,
    		audioMusicVolume,
    		audioSfxVolume,
    		audioUiVolume,
    		applySettings
    	});

    	$$self.$inject_state = $$props => {
    		if ('inputPlaceCubes' in $$props) $$invalidate(0, inputPlaceCubes = $$props.inputPlaceCubes);
    		if ('inputRemoveCubes' in $$props) $$invalidate(1, inputRemoveCubes = $$props.inputRemoveCubes);
    		if ('inputToggleGrid' in $$props) $$invalidate(2, inputToggleGrid = $$props.inputToggleGrid);
    		if ('inputPaletteRowScroll' in $$props) $$invalidate(3, inputPaletteRowScroll = $$props.inputPaletteRowScroll);
    		if ('inputSettingsShortcut' in $$props) $$invalidate(4, inputSettingsShortcut = $$props.inputSettingsShortcut);
    		if ('audioMasterVolume' in $$props) $$invalidate(5, audioMasterVolume = $$props.audioMasterVolume);
    		if ('audioMusicVolume' in $$props) $$invalidate(6, audioMusicVolume = $$props.audioMusicVolume);
    		if ('audioSfxVolume' in $$props) $$invalidate(7, audioSfxVolume = $$props.audioSfxVolume);
    		if ('audioUiVolume' in $$props) $$invalidate(8, audioUiVolume = $$props.audioUiVolume);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		inputPlaceCubes,
    		inputRemoveCubes,
    		inputToggleGrid,
    		inputPaletteRowScroll,
    		inputSettingsShortcut,
    		audioMasterVolume,
    		audioMusicVolume,
    		audioSfxVolume,
    		audioUiVolume,
    		applySettings,
    		$$scope,
    		slots,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input6_change_input_handler,
    		input7_change_input_handler,
    		input8_change_input_handler,
    		input9_change_input_handler
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
    	let br5;
    	let t9;
    	let a4;
    	let t11;
    	let a5;
    	let t13;
    	let a6;
    	let br6;
    	let br7;
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
    			t7 = text("\n\n\tSounds generated with ");
    			a3 = element("a");
    			a3.textContent = "jsfxr";
    			br5 = element("br");
    			t9 = text("\n\n\tMade with ");
    			a4 = element("a");
    			a4.textContent = "Node.js";
    			t11 = text(", ");
    			a5 = element("a");
    			a5.textContent = "Three.js";
    			t13 = text(", and ");
    			a6 = element("a");
    			a6.textContent = "Svelte";
    			br6 = element("br");
    			br7 = element("br");
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
    			attr_dev(a3, "href", "https://sfxr.me");
    			add_location(a3, file$1, 9, 23, 536);
    			add_location(br5, file$1, 9, 58, 571);
    			attr_dev(a4, "href", "https://nodejs.org");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "rel", "noopener noreferrer");
    			add_location(a4, file$1, 11, 11, 588);
    			attr_dev(a5, "href", "https://threejs.org");
    			attr_dev(a5, "target", "_blank");
    			attr_dev(a5, "rel", "noopener noreferrer");
    			add_location(a5, file$1, 11, 95, 672);
    			attr_dev(a6, "href", "https://svelte.dev");
    			attr_dev(a6, "target", "_blank");
    			attr_dev(a6, "rel", "noopener noreferrer");
    			add_location(a6, file$1, 11, 185, 762);
    			add_location(br6, file$1, 11, 266, 843);
    			add_location(br7, file$1, 11, 270, 847);
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
    			append_dev(div, br5);
    			append_dev(div, t9);
    			append_dev(div, a4);
    			append_dev(div, t11);
    			append_dev(div, a5);
    			append_dev(div, t13);
    			append_dev(div, a6);
    			append_dev(div, br6);
    			append_dev(div, br7);
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

    // (30:11) <EscWinNavs>
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
    		source: "(30:11) <EscWinNavs>",
    		ctx
    	});

    	return block;
    }

    // (30:1) <Settings>
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
    		source: "(30:1) <Settings>",
    		ctx
    	});

    	return block;
    }

    // (31:10) <EscWinNavs>
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
    		source: "(31:10) <EscWinNavs>",
    		ctx
    	});

    	return block;
    }

    // (31:1) <Credits>
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
    		source: "(31:1) <Credits>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let welcome;
    	let t0;
    	let main;
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
    	let settings;
    	let t7;
    	let credits;
    	let current;
    	welcome = new Welcome({ $$inline: true });
    	switchplacement = new SwitchPlacement({ $$inline: true });
    	palette = new Palette({ $$inline: true });
    	coordinates = new Coordinates({ $$inline: true });
    	chat = new Chat({ $$inline: true });
    	esc = new Esc({ $$inline: true });

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
    			main = element("main");
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
    			create_component(settings.$$.fragment);
    			t7 = space();
    			create_component(credits.$$.fragment);
    			attr_dev(div0, "id", "itsEditTime");
    			add_location(div0, file, 19, 2, 545);
    			attr_dev(img, "id", "crosshair");
    			attr_dev(img, "class", "center");
    			if (!src_url_equal(img.src, img_src_value = "./images/svgs/crosshair.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "+");
    			add_location(img, file, 25, 2, 642);
    			attr_dev(div1, "id", "uiCanvas");
    			add_location(div1, file, 17, 1, 506);
    			add_location(main, file, 16, 0, 498);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(welcome, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
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
    			append_dev(main, t5);
    			mount_component(esc, main, null);
    			append_dev(main, t6);
    			mount_component(settings, main, null);
    			append_dev(main, t7);
    			mount_component(credits, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    			transition_out(settings.$$.fragment, local);
    			transition_out(credits.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(welcome, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(switchplacement);
    			destroy_component(palette);
    			destroy_component(coordinates);
    			destroy_component(chat);
    			destroy_component(esc);
    			destroy_component(settings);
    			destroy_component(credits);
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
