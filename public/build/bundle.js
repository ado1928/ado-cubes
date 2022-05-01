
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
    			add_location(button0, file$5, 26, 2, 624);
    			attr_dev(button1, "id", "escCredits");
    			add_location(button1, file$5, 27, 2, 686);
    			attr_dev(button2, "id", "escSettings");
    			add_location(button2, file$5, 28, 2, 751);
    			add_location(br, file$5, 30, 2, 820);
    			attr_dev(a0, "href", "https://github.com/ado1928/ado-cubes");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$5, 33, 3, 888);
    			attr_dev(a1, "href", "https://discord.gg/rNMTeADfnc");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$5, 33, 118, 1003);
    			set_style(div0, "display", "flex");
    			set_style(div0, "flex-direction", "row");
    			set_style(div0, "width", "auto");
    			add_location(div0, file$5, 32, 2, 828);
    			attr_dev(div1, "id", "escMenu");
    			attr_dev(div1, "class", "box center");
    			add_location(div1, file$5, 25, 1, 584);
    			attr_dev(div2, "id", "esc");
    			add_location(div2, file$5, 24, 0, 568);
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
    			add_location(img0, file$4, 12, 43, 340);
    			attr_dev(button0, "class", "iconav");
    			add_location(button0, file$4, 12, 1, 298);
    			set_style(h2, "margin", "0");
    			add_location(h2, file$4, 13, 1, 401);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/icons/exit.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "X");
    			add_location(img1, file$4, 14, 43, 479);
    			attr_dev(button1, "class", "iconav");
    			add_location(button1, file$4, 14, 1, 437);
    			set_style(div, "display", "flex");
    			set_style(div, "justify-content", "space-between");
    			set_style(div, "align-items", "center");
    			set_style(div, "padding", "4px 4px");
    			set_style(div, "margin-bottom", "12px");
    			add_location(div, file$4, 11, 0, 186);
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
    			t8 = text("Check controls by pressing Escape, click on Settings, and look at Input category.");
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
    			add_location(img, file$3, 45, 2, 1269);
    			add_location(div0, file$3, 44, 1, 1261);
    			add_location(br0, file$3, 47, 1, 1315);
    			add_location(br1, file$3, 47, 5, 1319);
    			attr_dev(input0, "id", "inputUsername");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$3, 48, 11, 1335);
    			add_location(br2, file$3, 48, 49, 1373);
    			attr_dev(input1, "id", "inputPassword");
    			attr_dev(input1, "type", "text");
    			input1.value = "this input does nothing for now. pls ignore";
    			add_location(input1, file$3, 49, 11, 1389);
    			add_location(br3, file$3, 49, 101, 1479);
    			add_location(br4, file$3, 50, 88, 1572);
    			add_location(br5, file$3, 50, 152, 1636);
    			attr_dev(p0, "id", "noNeedToVerify");
    			set_style(p0, "display", "none");
    			add_location(p0, file$3, 50, 1, 1485);
    			add_location(br6, file$3, 50, 160, 1644);
    			add_location(strong0, file$3, 52, 1, 1651);
    			add_location(br7, file$3, 52, 110, 1760);
    			add_location(br8, file$3, 52, 114, 1764);
    			add_location(strong1, file$3, 54, 1, 1771);
    			add_location(br9, file$3, 54, 61, 1831);
    			add_location(br10, file$3, 54, 134, 1904);
    			add_location(br11, file$3, 56, 45, 1997);
    			attr_dev(p1, "id", "captchaPlease");
    			set_style(p1, "display", "none");
    			add_location(p1, file$3, 56, 1, 1953);
    			attr_dev(div1, "class", "io-captcha");
    			attr_dev(div1, "data-pubkey", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO");
    			attr_dev(div1, "data-theme", "dark");
    			attr_dev(div1, "data-scale", "1.0");
    			attr_dev(div1, "data-font", "mono");
    			attr_dev(div1, "data-callback-solve", "solve");
    			attr_dev(div1, "data-widgetid", "iocaptcha");
    			add_location(div1, file$3, 57, 1, 2073);
    			attr_dev(div2, "id", "winWelcome");
    			attr_dev(div2, "class", "box win center");
    			set_style(div2, "top", "62%");
    			add_location(div2, file$3, 43, 0, 1199);
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
    		// this is terrible.
    		if (miscEnableRandomLogos.checked) {
    			if (Math.floor(Math.random() * 70) == 1) {
    				odacebus();
    			} else if (Math.floor(Math.random() * 900) == 1) {
    				aaaaaaaa();
    			} else if (Math.floor(Math.random() * 727) == 1) {
    				ado();
    			} else if (audioEnableMusic.checked) {
    				let music = new Audio('./audio/music/The Moon.ogg');
    				music.play();
    			}
    		} else if (audioEnableMusic.checked) {
    			let music = new Audio('./audio/music/The Moon.ogg');
    			music.play();
    		}

    		function odacebus() {
    			$$invalidate(0, src = "./images/logo/odacebus.svg");
    		}

    		function aaaaaaaa() {
    			$$invalidate(0, src = "./images/logo/aaaaaaaa.svg");

    			if (audioEnableMusic.checked) {
    				let aaaaaaaa = new Audio('./audio/screaming.ogg');
    				aaaaaaaa.play();
    			}
    		}

    		function ado() {
    			$$invalidate(0, src = "./images/logo/ado!.svg");
    			$$invalidate(1, style = "position:absolute;transform:translate(-50%, -164px);left:50%;pointer-events:none");

    			if (audioEnableMusic.checked) {
    				let ado = new Audio('./audio/welcome to ado.ogg');
    				ado.play();
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
    	let div24;
    	let t0;
    	let div23;
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
    	let div8;
    	let t31;
    	let input6;
    	let t32;
    	let div9;
    	let t33;
    	let input7;
    	let t34;
    	let div10;
    	let t35;
    	let input8;
    	let t36;
    	let div11;
    	let t37;
    	let input9;
    	let t38;
    	let h23;
    	let t40;
    	let div12;
    	let img4;
    	let img4_src_value;
    	let t41;
    	let t42;
    	let t43;
    	let input10;
    	let t44;
    	let div13;
    	let img5;
    	let img5_src_value;
    	let t45;
    	let t46;
    	let t47;
    	let input11;
    	let t48;
    	let div14;
    	let img6;
    	let img6_src_value;
    	let t49;
    	let t50;
    	let t51;
    	let input12;
    	let t52;
    	let div15;
    	let img7;
    	let img7_src_value;
    	let t53;
    	let input13;
    	let t54;
    	let div16;
    	let t55;
    	let input14;
    	let t56;
    	let div17;
    	let t57;
    	let input15;
    	let t58;
    	let h24;
    	let t60;
    	let div18;
    	let img8;
    	let img8_src_value;
    	let t61;
    	let input16;
    	let t62;
    	let h25;
    	let t64;
    	let div19;
    	let img9;
    	let img9_src_value;
    	let t65;
    	let input17;
    	let t66;
    	let h26;
    	let t68;
    	let div20;
    	let strong;
    	let t70;
    	let t71;
    	let div21;
    	let img10;
    	let img10_src_value;
    	let t72;
    	let input18;
    	let t73;
    	let div22;
    	let img11;
    	let img11_src_value;
    	let t74;
    	let input19;
    	let t75;
    	let button0;
    	let t77;
    	let button1;
    	let t79;
    	let button2;
    	let t81;
    	let button3;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	const block = {
    		c: function create() {
    			div24 = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div23 = element("div");
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
    			t27 = text("Increase camera speed ");
    			input4 = element("input");
    			t28 = space();
    			div7 = element("div");
    			t29 = text("decrease camera speed ");
    			input5 = element("input");
    			t30 = space();
    			div8 = element("div");
    			t31 = text("Increase camera zoom ");
    			input6 = element("input");
    			t32 = space();
    			div9 = element("div");
    			t33 = text("decrease camera zoom ");
    			input7 = element("input");
    			t34 = space();
    			div10 = element("div");
    			t35 = text("Settings shortcut ");
    			input8 = element("input");
    			t36 = space();
    			div11 = element("div");
    			t37 = text("Disable mouse place and remove ");
    			input9 = element("input");
    			t38 = space();
    			h23 = element("h2");
    			h23.textContent = "Audio";
    			t40 = space();
    			div12 = element("div");
    			img4 = element("img");
    			t41 = text(" Music ");
    			t42 = text(/*audioMusicVolume*/ ctx[9]);
    			t43 = space();
    			input10 = element("input");
    			t44 = space();
    			div13 = element("div");
    			img5 = element("img");
    			t45 = text(" SFX ");
    			t46 = text(/*audioSfxVolume*/ ctx[10]);
    			t47 = space();
    			input11 = element("input");
    			t48 = space();
    			div14 = element("div");
    			img6 = element("img");
    			t49 = text(" UI ");
    			t50 = text(/*audioUiVolume*/ ctx[11]);
    			t51 = space();
    			input12 = element("input");
    			t52 = space();
    			div15 = element("div");
    			img7 = element("img");
    			t53 = text(" Enable music ");
    			input13 = element("input");
    			t54 = space();
    			div16 = element("div");
    			t55 = text("Disable place and remove sounds ");
    			input14 = element("input");
    			t56 = space();
    			div17 = element("div");
    			t57 = text("Disable UI sounds ");
    			input15 = element("input");
    			t58 = space();
    			h24 = element("h2");
    			h24.textContent = "Performance";
    			t60 = space();
    			div18 = element("div");
    			img8 = element("img");
    			t61 = text(" Enable clouds ");
    			input16 = element("input");
    			t62 = space();
    			h25 = element("h2");
    			h25.textContent = "Miscellaneous";
    			t64 = space();
    			div19 = element("div");
    			img9 = element("img");
    			t65 = text(" Enable random logos in welcome ");
    			input17 = element("input");
    			t66 = space();
    			h26 = element("h2");
    			h26.textContent = "Theme";
    			t68 = space();
    			div20 = element("div");
    			strong = element("strong");
    			strong.textContent = "NOTE:";
    			t70 = text(" Blur does not properly work in Firefox");
    			t71 = space();
    			div21 = element("div");
    			img10 = element("img");
    			t72 = text(" Disable background blur ");
    			input18 = element("input");
    			t73 = space();
    			div22 = element("div");
    			img11 = element("img");
    			t74 = text(" Disable text shadows ");
    			input19 = element("input");
    			t75 = space();
    			button0 = element("button");
    			button0.textContent = "Button";
    			t77 = space();
    			button1 = element("button");
    			button1.textContent = "Apply";
    			t79 = space();
    			button2 = element("button");
    			button2.textContent = "Refresh";
    			t81 = space();
    			button3 = element("button");
    			button3.textContent = "Button";
    			set_style(h20, "margin", "0");
    			add_location(h20, file$2, 91, 2, 2968);
    			if (!src_url_equal(img0.src, img0_src_value = /*notfunctional*/ ctx[12])) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$2, 92, 2, 3003);
    			add_location(br, file$2, 92, 44, 3045);
    			if (!src_url_equal(img1.src, img1_src_value = /*requiresrefresh*/ ctx[13])) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 93, 2, 3052);
    			add_location(h21, file$2, 95, 2, 3102);
    			if (!src_url_equal(img2.src, img2_src_value = "./images/icons/not functional.svg")) attr_dev(img2, "src", img2_src_value);
    			add_location(img2, file$2, 96, 7, 3126);
    			option0.__value = "english";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 98, 4, 3218);
    			option1.__value = "onlyEnglish";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 99, 4, 3263);
    			attr_dev(select0, "id", "generalLanguage");
    			add_location(select0, file$2, 97, 3, 3184);
    			add_location(div0, file$2, 96, 2, 3121);
    			add_location(h22, file$2, 103, 2, 3339);
    			if (!src_url_equal(img3.src, img3_src_value = /*notfunctional*/ ctx[12])) attr_dev(img3, "src", img3_src_value);
    			add_location(img3, file$2, 104, 7, 3361);
    			option2.__value = "wasd";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 106, 4, 3444);
    			option3.__value = "arrow";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 107, 4, 3483);
    			option4.__value = "custom";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 108, 4, 3529);
    			attr_dev(select1, "id", "inputMovement");
    			add_location(select1, file$2, 105, 3, 3399);
    			add_location(div1, file$2, 104, 2, 3356);
    			attr_dev(input0, "id", "inputPlaceCubes");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$2, 117, 19, 3805);
    			add_location(div2, file$2, 117, 2, 3788);
    			attr_dev(input1, "id", "inputRemoveCubes");
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$2, 118, 20, 3901);
    			add_location(div3, file$2, 118, 2, 3883);
    			attr_dev(input2, "id", "inputToggleGrid");
    			attr_dev(input2, "type", "text");
    			add_location(input2, file$2, 119, 19, 3998);
    			add_location(div4, file$2, 119, 2, 3981);
    			attr_dev(input3, "id", "inputPaletteRowScroll");
    			attr_dev(input3, "type", "text");
    			add_location(input3, file$2, 120, 26, 4100);
    			add_location(div5, file$2, 120, 2, 4076);
    			attr_dev(input4, "id", "inputIncreaseCameraSpeed");
    			attr_dev(input4, "type", "text");
    			add_location(input4, file$2, 121, 29, 4217);
    			add_location(div6, file$2, 121, 2, 4190);
    			attr_dev(input5, "id", "inputDecreaseCameraSpeed");
    			attr_dev(input5, "type", "text");
    			add_location(input5, file$2, 122, 29, 4340);
    			add_location(div7, file$2, 122, 2, 4313);
    			attr_dev(input6, "id", "inputIncreaseCameraZoom");
    			attr_dev(input6, "type", "text");
    			add_location(input6, file$2, 123, 28, 4462);
    			add_location(div8, file$2, 123, 2, 4436);
    			attr_dev(input7, "id", "inputDncreaseCameraZoom");
    			attr_dev(input7, "type", "text");
    			add_location(input7, file$2, 124, 28, 4582);
    			add_location(div9, file$2, 124, 2, 4556);
    			attr_dev(input8, "id", "inputSettingsShortcut");
    			attr_dev(input8, "type", "text");
    			add_location(input8, file$2, 125, 25, 4699);
    			add_location(div10, file$2, 125, 2, 4676);
    			attr_dev(input9, "id", "inputDisablePR");
    			attr_dev(input9, "type", "checkbox");
    			add_location(input9, file$2, 126, 38, 4825);
    			add_location(div11, file$2, 126, 2, 4789);
    			add_location(h23, file$2, 128, 2, 4878);
    			if (!src_url_equal(img4.src, img4_src_value = /*notfunctional*/ ctx[12])) attr_dev(img4, "src", img4_src_value);
    			add_location(img4, file$2, 129, 7, 4900);
    			attr_dev(input10, "id", "musicVolume");
    			attr_dev(input10, "class", "slider");
    			attr_dev(input10, "type", "range");
    			add_location(input10, file$2, 129, 58, 4951);
    			add_location(div12, file$2, 129, 2, 4895);
    			if (!src_url_equal(img5.src, img5_src_value = /*notfunctional*/ ctx[12])) attr_dev(img5, "src", img5_src_value);
    			add_location(img5, file$2, 130, 7, 5047);
    			attr_dev(input11, "id", "sfxVolume");
    			attr_dev(input11, "class", "slider");
    			attr_dev(input11, "type", "range");
    			add_location(input11, file$2, 130, 54, 5094);
    			add_location(div13, file$2, 130, 2, 5042);
    			if (!src_url_equal(img6.src, img6_src_value = /*notfunctional*/ ctx[12])) attr_dev(img6, "src", img6_src_value);
    			add_location(img6, file$2, 131, 7, 5186);
    			attr_dev(input12, "id", "uiVolume");
    			attr_dev(input12, "class", "slider");
    			attr_dev(input12, "type", "range");
    			add_location(input12, file$2, 131, 52, 5231);
    			add_location(div14, file$2, 131, 2, 5181);
    			if (!src_url_equal(img7.src, img7_src_value = /*requiresrefresh*/ ctx[13])) attr_dev(img7, "src", img7_src_value);
    			add_location(img7, file$2, 133, 7, 5322);
    			attr_dev(input13, "id", "audioEnableMusic");
    			attr_dev(input13, "type", "checkbox");
    			add_location(input13, file$2, 133, 48, 5363);
    			add_location(div15, file$2, 133, 2, 5317);
    			attr_dev(input14, "id", "audioDisablePR");
    			attr_dev(input14, "type", "checkbox");
    			add_location(input14, file$2, 134, 39, 5454);
    			add_location(div16, file$2, 134, 2, 5417);
    			attr_dev(input15, "id", "audioDisableUI");
    			attr_dev(input15, "type", "checkbox");
    			add_location(input15, file$2, 135, 25, 5529);
    			add_location(div17, file$2, 135, 2, 5506);
    			add_location(h24, file$2, 137, 2, 5582);
    			if (!src_url_equal(img8.src, img8_src_value = /*notfunctional*/ ctx[12])) attr_dev(img8, "src", img8_src_value);
    			add_location(img8, file$2, 138, 7, 5610);
    			attr_dev(input16, "id", "prfmEnableClouds");
    			attr_dev(input16, "type", "checkbox");
    			add_location(input16, file$2, 138, 47, 5650);
    			add_location(div18, file$2, 138, 2, 5605);
    			add_location(h25, file$2, 140, 2, 5705);
    			if (!src_url_equal(img9.src, img9_src_value = /*requiresrefresh*/ ctx[13])) attr_dev(img9, "src", img9_src_value);
    			add_location(img9, file$2, 141, 7, 5735);
    			attr_dev(input17, "id", "miscEnableRandomLogos");
    			attr_dev(input17, "type", "checkbox");
    			add_location(input17, file$2, 141, 66, 5794);
    			add_location(div19, file$2, 141, 2, 5730);
    			add_location(h26, file$2, 143, 2, 5854);
    			add_location(strong, file$2, 144, 7, 5876);
    			add_location(div20, file$2, 144, 2, 5871);
    			if (!src_url_equal(img10.src, img10_src_value = /*notfunctional*/ ctx[12])) attr_dev(img10, "src", img10_src_value);
    			add_location(img10, file$2, 145, 7, 5951);
    			attr_dev(input18, "id", "themeDisableBgBlur");
    			attr_dev(input18, "type", "checkbox");
    			add_location(input18, file$2, 145, 57, 6001);
    			add_location(div21, file$2, 145, 2, 5946);
    			if (!src_url_equal(img11.src, img11_src_value = /*notfunctional*/ ctx[12])) attr_dev(img11, "src", img11_src_value);
    			add_location(img11, file$2, 146, 7, 6062);
    			attr_dev(input19, "id", "themeDisableTextShadows");
    			attr_dev(input19, "type", "checkbox");
    			add_location(input19, file$2, 146, 54, 6109);
    			add_location(div22, file$2, 146, 2, 6057);
    			set_style(div23, "overflow-y", "scroll");
    			set_style(div23, "height", "80%");
    			add_location(div23, file$2, 90, 1, 2923);
    			add_location(button0, file$2, 148, 1, 6177);
    			attr_dev(button1, "id", "applySettings");
    			add_location(button1, file$2, 148, 25, 6201);
    			attr_dev(button2, "onclick", "history.go(0)");
    			add_location(button2, file$2, 148, 92, 6268);
    			add_location(button3, file$2, 148, 141, 6317);
    			attr_dev(div24, "id", "winSettings");
    			attr_dev(div24, "class", "box win center");
    			add_location(div24, file$2, 88, 0, 2867);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div24, anchor);

    			if (default_slot) {
    				default_slot.m(div24, null);
    			}

    			append_dev(div24, t0);
    			append_dev(div24, div23);
    			append_dev(div23, h20);
    			append_dev(div23, t2);
    			append_dev(div23, img0);
    			append_dev(div23, t3);
    			append_dev(div23, br);
    			append_dev(div23, t4);
    			append_dev(div23, img1);
    			append_dev(div23, t5);
    			append_dev(div23, h21);
    			append_dev(div23, t7);
    			append_dev(div23, div0);
    			append_dev(div0, img2);
    			append_dev(div0, t8);
    			append_dev(div0, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(div23, t11);
    			append_dev(div23, h22);
    			append_dev(div23, t13);
    			append_dev(div23, div1);
    			append_dev(div1, img3);
    			append_dev(div1, t14);
    			append_dev(div1, select1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, "wasd");
    			append_dev(div23, t18);
    			append_dev(div23, div2);
    			append_dev(div2, t19);
    			append_dev(div2, input0);
    			set_input_value(input0, /*inputPlaceCubes*/ ctx[0]);
    			append_dev(div23, t20);
    			append_dev(div23, div3);
    			append_dev(div3, t21);
    			append_dev(div3, input1);
    			set_input_value(input1, /*inputRemoveCubes*/ ctx[1]);
    			append_dev(div23, t22);
    			append_dev(div23, div4);
    			append_dev(div4, t23);
    			append_dev(div4, input2);
    			set_input_value(input2, /*inputToggleGrid*/ ctx[2]);
    			append_dev(div23, t24);
    			append_dev(div23, div5);
    			append_dev(div5, t25);
    			append_dev(div5, input3);
    			set_input_value(input3, /*inputPaletteRowScroll*/ ctx[3]);
    			append_dev(div23, t26);
    			append_dev(div23, div6);
    			append_dev(div6, t27);
    			append_dev(div6, input4);
    			set_input_value(input4, /*inputIncreaseCameraSpeed*/ ctx[4]);
    			append_dev(div23, t28);
    			append_dev(div23, div7);
    			append_dev(div7, t29);
    			append_dev(div7, input5);
    			set_input_value(input5, /*inputDecreaseCameraSpeed*/ ctx[5]);
    			append_dev(div23, t30);
    			append_dev(div23, div8);
    			append_dev(div8, t31);
    			append_dev(div8, input6);
    			set_input_value(input6, /*inputIncreaseCameraZoom*/ ctx[6]);
    			append_dev(div23, t32);
    			append_dev(div23, div9);
    			append_dev(div9, t33);
    			append_dev(div9, input7);
    			set_input_value(input7, /*inputDecreaseCameraZoom*/ ctx[7]);
    			append_dev(div23, t34);
    			append_dev(div23, div10);
    			append_dev(div10, t35);
    			append_dev(div10, input8);
    			set_input_value(input8, /*inputSettingsShortcut*/ ctx[8]);
    			append_dev(div23, t36);
    			append_dev(div23, div11);
    			append_dev(div11, t37);
    			append_dev(div11, input9);
    			append_dev(div23, t38);
    			append_dev(div23, h23);
    			append_dev(div23, t40);
    			append_dev(div23, div12);
    			append_dev(div12, img4);
    			append_dev(div12, t41);
    			append_dev(div12, t42);
    			append_dev(div12, t43);
    			append_dev(div12, input10);
    			set_input_value(input10, /*audioMusicVolume*/ ctx[9]);
    			append_dev(div23, t44);
    			append_dev(div23, div13);
    			append_dev(div13, img5);
    			append_dev(div13, t45);
    			append_dev(div13, t46);
    			append_dev(div13, t47);
    			append_dev(div13, input11);
    			set_input_value(input11, /*audioSfxVolume*/ ctx[10]);
    			append_dev(div23, t48);
    			append_dev(div23, div14);
    			append_dev(div14, img6);
    			append_dev(div14, t49);
    			append_dev(div14, t50);
    			append_dev(div14, t51);
    			append_dev(div14, input12);
    			set_input_value(input12, /*audioUiVolume*/ ctx[11]);
    			append_dev(div23, t52);
    			append_dev(div23, div15);
    			append_dev(div15, img7);
    			append_dev(div15, t53);
    			append_dev(div15, input13);
    			append_dev(div23, t54);
    			append_dev(div23, div16);
    			append_dev(div16, t55);
    			append_dev(div16, input14);
    			append_dev(div23, t56);
    			append_dev(div23, div17);
    			append_dev(div17, t57);
    			append_dev(div17, input15);
    			append_dev(div23, t58);
    			append_dev(div23, h24);
    			append_dev(div23, t60);
    			append_dev(div23, div18);
    			append_dev(div18, img8);
    			append_dev(div18, t61);
    			append_dev(div18, input16);
    			append_dev(div23, t62);
    			append_dev(div23, h25);
    			append_dev(div23, t64);
    			append_dev(div23, div19);
    			append_dev(div19, img9);
    			append_dev(div19, t65);
    			append_dev(div19, input17);
    			append_dev(div23, t66);
    			append_dev(div23, h26);
    			append_dev(div23, t68);
    			append_dev(div23, div20);
    			append_dev(div20, strong);
    			append_dev(div20, t70);
    			append_dev(div23, t71);
    			append_dev(div23, div21);
    			append_dev(div21, img10);
    			append_dev(div21, t72);
    			append_dev(div21, input18);
    			append_dev(div23, t73);
    			append_dev(div23, div22);
    			append_dev(div22, img11);
    			append_dev(div22, t74);
    			append_dev(div22, input19);
    			append_dev(div24, t75);
    			append_dev(div24, button0);
    			append_dev(div24, t77);
    			append_dev(div24, button1);
    			append_dev(div24, t79);
    			append_dev(div24, button2);
    			append_dev(div24, t81);
    			append_dev(div24, button3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[17]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[18]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[19]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[20]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[21]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[22]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[23]),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[24]),
    					listen_dev(input8, "input", /*input8_input_handler*/ ctx[25]),
    					listen_dev(input10, "change", /*input10_change_input_handler*/ ctx[26]),
    					listen_dev(input10, "input", /*input10_change_input_handler*/ ctx[26]),
    					listen_dev(input11, "change", /*input11_change_input_handler*/ ctx[27]),
    					listen_dev(input11, "input", /*input11_change_input_handler*/ ctx[27]),
    					listen_dev(input12, "change", /*input12_change_input_handler*/ ctx[28]),
    					listen_dev(input12, "input", /*input12_change_input_handler*/ ctx[28]),
    					listen_dev(button1, "click", /*applySettings*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[15],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null),
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

    			if (dirty & /*inputIncreaseCameraSpeed*/ 16 && input4.value !== /*inputIncreaseCameraSpeed*/ ctx[4]) {
    				set_input_value(input4, /*inputIncreaseCameraSpeed*/ ctx[4]);
    			}

    			if (dirty & /*inputDecreaseCameraSpeed*/ 32 && input5.value !== /*inputDecreaseCameraSpeed*/ ctx[5]) {
    				set_input_value(input5, /*inputDecreaseCameraSpeed*/ ctx[5]);
    			}

    			if (dirty & /*inputIncreaseCameraZoom*/ 64 && input6.value !== /*inputIncreaseCameraZoom*/ ctx[6]) {
    				set_input_value(input6, /*inputIncreaseCameraZoom*/ ctx[6]);
    			}

    			if (dirty & /*inputDecreaseCameraZoom*/ 128 && input7.value !== /*inputDecreaseCameraZoom*/ ctx[7]) {
    				set_input_value(input7, /*inputDecreaseCameraZoom*/ ctx[7]);
    			}

    			if (dirty & /*inputSettingsShortcut*/ 256 && input8.value !== /*inputSettingsShortcut*/ ctx[8]) {
    				set_input_value(input8, /*inputSettingsShortcut*/ ctx[8]);
    			}

    			if (!current || dirty & /*audioMusicVolume*/ 512) set_data_dev(t42, /*audioMusicVolume*/ ctx[9]);

    			if (dirty & /*audioMusicVolume*/ 512) {
    				set_input_value(input10, /*audioMusicVolume*/ ctx[9]);
    			}

    			if (!current || dirty & /*audioSfxVolume*/ 1024) set_data_dev(t46, /*audioSfxVolume*/ ctx[10]);

    			if (dirty & /*audioSfxVolume*/ 1024) {
    				set_input_value(input11, /*audioSfxVolume*/ ctx[10]);
    			}

    			if (!current || dirty & /*audioUiVolume*/ 2048) set_data_dev(t50, /*audioUiVolume*/ ctx[11]);

    			if (dirty & /*audioUiVolume*/ 2048) {
    				set_input_value(input12, /*audioUiVolume*/ ctx[11]);
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
    			if (detaching) detach_dev(div24);
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
    	let notfunctional = "./images/icons/not functional.svg";
    	let requiresrefresh = "./images/icons/requires refresh.svg";

    	// haha i suck at this.
    	onMount(async () => {
    		function loadSettings() {
    			let pref = JSON.parse(localStorage.getItem('settings'));
    			$$invalidate(0, inputPlaceCubes = pref.inputPlaceCubes);
    			$$invalidate(1, inputRemoveCubes = pref.inputRemoveCubes);
    			$$invalidate(2, inputToggleGrid = pref.inputToggleGrid);
    			$$invalidate(3, inputPaletteRowScroll = pref.inputPaletteRowScroll);
    			$$invalidate(8, inputSettingsShortcut = pref.inputSettingsShortcut);
    			$$invalidate(4, inputIncreaseCameraSpeed = pref.inputIncreaseCameraSpeed);
    			$$invalidate(5, inputDecreaseCameraSpeed = pref.inputDecreaseCameraSpeed);
    			$$invalidate(6, inputIncreaseCameraZoom = pref.inputIncreaseCameraZoom);
    			$$invalidate(7, inputDecreaseCameraZoom = pref.inputDecreaseCameraZoom);
    			inputDisablePR.checked = pref.inputDisablePR;
    			$$invalidate(9, audioMusicVolume = pref.audioMusicVolume);
    			$$invalidate(10, audioSfxVolume = pref.audioSfxVolume);
    			$$invalidate(11, audioUiVolume = pref.audioUiVolume);
    			audioEnableMusic.checked = pref.audioEnableMusic;
    			audioDisablePR.checked = pref.audioDisablePR;
    			miscEnableRandomLogos.checked = pref.miscEnableRandomLogos;
    			themeDisableBgBlur = pref.themeDisableBgBlur;
    			themeDisableTextShadows.checked = pref.themeDisableTextShadows;
    		}
    		loadSettings();
    	});

    	let inputPlaceCubes = "KeyX";
    	let inputRemoveCubes = "KeyC";
    	let inputToggleGrid = "KeyG";
    	let inputPaletteRowScroll = "AltLeft";
    	let inputIncreaseCameraSpeed = "BracketRight";
    	let inputDecreaseCameraSpeed = "BracketLeft";
    	let inputIncreaseCameraZoom = "Equal";
    	let inputDecreaseCameraZoom = "Minus";
    	let inputSettingsShortcut = "KeyL";
    	let audioMusicVolume = 100;
    	let audioSfxVolume = 100;
    	let audioUiVolume = 100;

    	function applySettings() {
    		const storeSettings = {
    			inputPlaceCubes,
    			inputRemoveCubes,
    			inputToggleGrid,
    			inputPaletteRowScroll,
    			inputIncreaseCameraSpeed,
    			inputDecreaseCameraSpeed,
    			inputIncreaseCameraZoom,
    			inputDecreaseCameraZoom,
    			inputSettingsShortcut,
    			inputDisablePR: inputDisablePR.checked,
    			audioSfxVolume,
    			audioUiVolume,
    			audioEnableMusic: audioEnableMusic.checked,
    			audioDisablePR: audioDisablePR.checked,
    			miscEnableRandomLogos: miscEnableRandomLogos.checked,
    			themeDisableBgBlur: themeDisableBgBlur.checked,
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
    		inputIncreaseCameraSpeed = this.value;
    		$$invalidate(4, inputIncreaseCameraSpeed);
    	}

    	function input5_input_handler() {
    		inputDecreaseCameraSpeed = this.value;
    		$$invalidate(5, inputDecreaseCameraSpeed);
    	}

    	function input6_input_handler() {
    		inputIncreaseCameraZoom = this.value;
    		$$invalidate(6, inputIncreaseCameraZoom);
    	}

    	function input7_input_handler() {
    		inputDecreaseCameraZoom = this.value;
    		$$invalidate(7, inputDecreaseCameraZoom);
    	}

    	function input8_input_handler() {
    		inputSettingsShortcut = this.value;
    		$$invalidate(8, inputSettingsShortcut);
    	}

    	function input10_change_input_handler() {
    		audioMusicVolume = to_number(this.value);
    		$$invalidate(9, audioMusicVolume);
    	}

    	function input11_change_input_handler() {
    		audioSfxVolume = to_number(this.value);
    		$$invalidate(10, audioSfxVolume);
    	}

    	function input12_change_input_handler() {
    		audioUiVolume = to_number(this.value);
    		$$invalidate(11, audioUiVolume);
    	}

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		HexToRGB,
    		notfunctional,
    		requiresrefresh,
    		inputPlaceCubes,
    		inputRemoveCubes,
    		inputToggleGrid,
    		inputPaletteRowScroll,
    		inputIncreaseCameraSpeed,
    		inputDecreaseCameraSpeed,
    		inputIncreaseCameraZoom,
    		inputDecreaseCameraZoom,
    		inputSettingsShortcut,
    		audioMusicVolume,
    		audioSfxVolume,
    		audioUiVolume,
    		applySettings
    	});

    	$$self.$inject_state = $$props => {
    		if ('notfunctional' in $$props) $$invalidate(12, notfunctional = $$props.notfunctional);
    		if ('requiresrefresh' in $$props) $$invalidate(13, requiresrefresh = $$props.requiresrefresh);
    		if ('inputPlaceCubes' in $$props) $$invalidate(0, inputPlaceCubes = $$props.inputPlaceCubes);
    		if ('inputRemoveCubes' in $$props) $$invalidate(1, inputRemoveCubes = $$props.inputRemoveCubes);
    		if ('inputToggleGrid' in $$props) $$invalidate(2, inputToggleGrid = $$props.inputToggleGrid);
    		if ('inputPaletteRowScroll' in $$props) $$invalidate(3, inputPaletteRowScroll = $$props.inputPaletteRowScroll);
    		if ('inputIncreaseCameraSpeed' in $$props) $$invalidate(4, inputIncreaseCameraSpeed = $$props.inputIncreaseCameraSpeed);
    		if ('inputDecreaseCameraSpeed' in $$props) $$invalidate(5, inputDecreaseCameraSpeed = $$props.inputDecreaseCameraSpeed);
    		if ('inputIncreaseCameraZoom' in $$props) $$invalidate(6, inputIncreaseCameraZoom = $$props.inputIncreaseCameraZoom);
    		if ('inputDecreaseCameraZoom' in $$props) $$invalidate(7, inputDecreaseCameraZoom = $$props.inputDecreaseCameraZoom);
    		if ('inputSettingsShortcut' in $$props) $$invalidate(8, inputSettingsShortcut = $$props.inputSettingsShortcut);
    		if ('audioMusicVolume' in $$props) $$invalidate(9, audioMusicVolume = $$props.audioMusicVolume);
    		if ('audioSfxVolume' in $$props) $$invalidate(10, audioSfxVolume = $$props.audioSfxVolume);
    		if ('audioUiVolume' in $$props) $$invalidate(11, audioUiVolume = $$props.audioUiVolume);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		inputPlaceCubes,
    		inputRemoveCubes,
    		inputToggleGrid,
    		inputPaletteRowScroll,
    		inputIncreaseCameraSpeed,
    		inputDecreaseCameraSpeed,
    		inputIncreaseCameraZoom,
    		inputDecreaseCameraZoom,
    		inputSettingsShortcut,
    		audioMusicVolume,
    		audioSfxVolume,
    		audioUiVolume,
    		notfunctional,
    		requiresrefresh,
    		applySettings,
    		$$scope,
    		slots,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input10_change_input_handler,
    		input11_change_input_handler,
    		input12_change_input_handler
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
    	let div1;
    	let t0;
    	let div0;
    	let img;
    	let img_src_value;
    	let t1;
    	let br0;
    	let t2;
    	let a0;
    	let t4;
    	let br1;
    	let br2;
    	let t5;
    	let strong;
    	let t7;
    	let table;
    	let tr0;
    	let td0;
    	let a1;
    	let t9;
    	let td1;
    	let t11;
    	let tr1;
    	let td2;
    	let a2;
    	let t13;
    	let td3;
    	let t15;
    	let tr2;
    	let td4;
    	let a3;
    	let t17;
    	let td5;
    	let t19;
    	let br3;
    	let t20;
    	let a4;
    	let t22;
    	let a5;
    	let t24;
    	let a6;
    	let br4;
    	let t26;
    	let a7;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div0 = element("div");
    			img = element("img");
    			t1 = space();
    			br0 = element("br");
    			t2 = text("\n\n\t\tcreated by ");
    			a0 = element("a");
    			a0.textContent = "Ado1928";
    			t4 = space();
    			br1 = element("br");
    			br2 = element("br");
    			t5 = space();
    			strong = element("strong");
    			strong.textContent = "Contributors";
    			t7 = space();
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			a1 = element("a");
    			a1.textContent = "ifritdiezel";
    			t9 = space();
    			td1 = element("td");
    			td1.textContent = "Back-End";
    			t11 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			a2 = element("a");
    			a2.textContent = "macimas";
    			t13 = space();
    			td3 = element("td");
    			td3.textContent = "Front-End";
    			t15 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			a3 = element("a");
    			a3.textContent = "hyxud";
    			t17 = space();
    			td5 = element("td");
    			td5.textContent = "Mouse placing";
    			t19 = space();
    			br3 = element("br");
    			t20 = text("\n\n\t\tMade with ");
    			a4 = element("a");
    			a4.textContent = "Node.js";
    			t22 = text(", ");
    			a5 = element("a");
    			a5.textContent = "Three.js";
    			t24 = text(", and ");
    			a6 = element("a");
    			a6.textContent = "Svelte";
    			br4 = element("br");
    			t26 = text("\n\t\tSounds generated with ");
    			a7 = element("a");
    			a7.textContent = "jsfxr";
    			if (!src_url_equal(img.src, img_src_value = "./images/logo/adocubes.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "adocubes");
    			attr_dev(img, "target", "_blank");
    			attr_dev(img, "rel", "noopener noreferrer");
    			add_location(img, file$1, 3, 2, 89);
    			add_location(br0, file$1, 5, 2, 188);
    			attr_dev(a0, "href", "https://github.com/ado1928");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$1, 7, 13, 207);
    			add_location(br1, file$1, 9, 2, 301);
    			add_location(br2, file$1, 9, 6, 305);
    			add_location(strong, file$1, 11, 2, 313);
    			attr_dev(a1, "href", "https://github.com/ifritdiezel");
    			add_location(a1, file$1, 14, 8, 462);
    			add_location(td0, file$1, 14, 4, 458);
    			add_location(td1, file$1, 15, 4, 528);
    			add_location(tr0, file$1, 13, 3, 449);
    			attr_dev(a2, "href", "https://github.com/macimas");
    			add_location(a2, file$1, 18, 8, 571);
    			add_location(td2, file$1, 18, 4, 567);
    			add_location(td3, file$1, 19, 4, 629);
    			add_location(tr1, file$1, 17, 3, 558);
    			attr_dev(a3, "href", "https://github.com/hyxud");
    			add_location(a3, file$1, 22, 8, 673);
    			add_location(td4, file$1, 22, 4, 669);
    			add_location(td5, file$1, 23, 4, 727);
    			add_location(tr2, file$1, 21, 3, 660);
    			attr_dev(table, "class", "credits");
    			set_style(table, "text-align", "initial");
    			set_style(table, "width", "-moz-available");
    			set_style(table, "width", "-webkit-fill-available");
    			add_location(table, file$1, 12, 2, 345);
    			add_location(br3, file$1, 27, 2, 773);
    			attr_dev(a4, "href", "https://nodejs.org");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "rel", "noopener noreferrer");
    			add_location(a4, file$1, 29, 12, 791);
    			attr_dev(a5, "href", "https://threejs.org");
    			attr_dev(a5, "target", "_blank");
    			attr_dev(a5, "rel", "noopener noreferrer");
    			add_location(a5, file$1, 29, 96, 875);
    			attr_dev(a6, "href", "https://svelte.dev");
    			attr_dev(a6, "target", "_blank");
    			attr_dev(a6, "rel", "noopener noreferrer");
    			add_location(a6, file$1, 29, 186, 965);
    			add_location(br4, file$1, 29, 267, 1046);
    			attr_dev(a7, "href", "https://sfxr.me");
    			add_location(a7, file$1, 30, 24, 1075);
    			set_style(div0, "text-align", "center");
    			add_location(div0, file$1, 2, 1, 55);
    			attr_dev(div1, "id", "winCredits");
    			attr_dev(div1, "class", "box win center");
    			add_location(div1, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t1);
    			append_dev(div0, br0);
    			append_dev(div0, t2);
    			append_dev(div0, a0);
    			append_dev(div0, t4);
    			append_dev(div0, br1);
    			append_dev(div0, br2);
    			append_dev(div0, t5);
    			append_dev(div0, strong);
    			append_dev(div0, t7);
    			append_dev(div0, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, a1);
    			append_dev(tr0, t9);
    			append_dev(tr0, td1);
    			append_dev(table, t11);
    			append_dev(table, tr1);
    			append_dev(tr1, td2);
    			append_dev(td2, a2);
    			append_dev(tr1, t13);
    			append_dev(tr1, td3);
    			append_dev(table, t15);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, a3);
    			append_dev(tr2, t17);
    			append_dev(tr2, td5);
    			append_dev(div0, t19);
    			append_dev(div0, br3);
    			append_dev(div0, t20);
    			append_dev(div0, a4);
    			append_dev(div0, t22);
    			append_dev(div0, a5);
    			append_dev(div0, t24);
    			append_dev(div0, a6);
    			append_dev(div0, br4);
    			append_dev(div0, t26);
    			append_dev(div0, a7);
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
    			if (detaching) detach_dev(div1);
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
    			add_location(div0, file, 19, 2, 544);
    			attr_dev(img, "id", "crosshair");
    			attr_dev(img, "class", "center");
    			if (!src_url_equal(img.src, img_src_value = "./images/svgs/crosshair.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "+");
    			add_location(img, file, 25, 2, 641);
    			attr_dev(div1, "id", "uiCanvas");
    			add_location(div1, file, 17, 1, 505);
    			add_location(main, file, 16, 0, 497);
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
