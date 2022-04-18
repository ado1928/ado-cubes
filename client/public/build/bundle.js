
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

    /* src/ui/ingame/Welcome.svelte generated by Svelte v3.47.0 */

    const file$7 = "src/ui/ingame/Welcome.svelte";

    function create_fragment$8(ctx) {
    	let main;
    	let img;
    	let img_src_value;
    	let br0;
    	let br1;
    	let t0;
    	let br2;
    	let br3;
    	let t1;
    	let strong;
    	let br4;
    	let t3;
    	let br5;
    	let t4;
    	let br6;
    	let t5;
    	let br7;
    	let t6;
    	let br8;
    	let t7;
    	let br9;
    	let t8;
    	let br10;
    	let t9;
    	let br11;
    	let t10;
    	let br12;
    	let br13;
    	let t11;
    	let br14;
    	let t12;
    	let input0;
    	let br15;
    	let t13;
    	let input1;
    	let br16;
    	let t14;

    	const block = {
    		c: function create() {
    			main = element("main");
    			img = element("img");
    			br0 = element("br");
    			br1 = element("br");
    			t0 = text("\n\n\t0 players online");
    			br2 = element("br");
    			br3 = element("br");
    			t1 = space();
    			strong = element("strong");
    			strong.textContent = "Controls";
    			br4 = element("br");
    			t3 = text("\n\tWASD - Move");
    			br5 = element("br");
    			t4 = text("\n\tSpace - Fly up");
    			br6 = element("br");
    			t5 = text("\n\tShift - Fly down");
    			br7 = element("br");
    			t6 = text("\n\tX - Place cubes");
    			br8 = element("br");
    			t7 = text("\n\tC - Break cubes");
    			br9 = element("br");
    			t8 = text("\n\tG - Toggle grid");
    			br10 = element("br");
    			t9 = text("\n\tEnter - Open chat");
    			br11 = element("br");
    			t10 = text("\n\tL - Open settings");
    			br12 = element("br");
    			br13 = element("br");
    			t11 = text("\n\n\tPlease login.");
    			br14 = element("br");
    			t12 = text("\n\tUsername: ");
    			input0 = element("input");
    			br15 = element("br");
    			t13 = text("\n\tPassword: ");
    			input1 = element("input");
    			br16 = element("br");
    			t14 = text("\n\tCaptcha: captcha here");
    			if (!src_url_equal(img.src, img_src_value = "./images/svgs/adocubes.svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$7, 1, 1, 69);
    			add_location(br0, file$7, 1, 39, 107);
    			add_location(br1, file$7, 1, 43, 111);
    			add_location(br2, file$7, 3, 17, 134);
    			add_location(br3, file$7, 3, 21, 138);
    			add_location(strong, file$7, 5, 1, 145);
    			add_location(br4, file$7, 5, 26, 170);
    			add_location(br5, file$7, 6, 12, 187);
    			add_location(br6, file$7, 7, 15, 207);
    			add_location(br7, file$7, 8, 17, 229);
    			add_location(br8, file$7, 9, 16, 250);
    			add_location(br9, file$7, 10, 16, 271);
    			add_location(br10, file$7, 11, 16, 292);
    			add_location(br11, file$7, 12, 18, 315);
    			add_location(br12, file$7, 13, 18, 338);
    			add_location(br13, file$7, 13, 22, 342);
    			add_location(br14, file$7, 15, 14, 362);
    			attr_dev(input0, "id", "inputUsername");
    			add_location(input0, file$7, 16, 11, 378);
    			add_location(br15, file$7, 16, 37, 404);
    			attr_dev(input1, "id", "inputPassword");
    			input1.value = "this input does nothing for now. pls ignore";
    			add_location(input1, file$7, 17, 11, 420);
    			add_location(br16, file$7, 17, 89, 498);
    			attr_dev(main, "id", "winWelcome");
    			attr_dev(main, "class", "box center");
    			set_style(main, "text-align", "center");
    			add_location(main, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, img);
    			append_dev(main, br0);
    			append_dev(main, br1);
    			append_dev(main, t0);
    			append_dev(main, br2);
    			append_dev(main, br3);
    			append_dev(main, t1);
    			append_dev(main, strong);
    			append_dev(main, br4);
    			append_dev(main, t3);
    			append_dev(main, br5);
    			append_dev(main, t4);
    			append_dev(main, br6);
    			append_dev(main, t5);
    			append_dev(main, br7);
    			append_dev(main, t6);
    			append_dev(main, br8);
    			append_dev(main, t7);
    			append_dev(main, br9);
    			append_dev(main, t8);
    			append_dev(main, br10);
    			append_dev(main, t9);
    			append_dev(main, br11);
    			append_dev(main, t10);
    			append_dev(main, br12);
    			append_dev(main, br13);
    			append_dev(main, t11);
    			append_dev(main, br14);
    			append_dev(main, t12);
    			append_dev(main, input0);
    			append_dev(main, br15);
    			append_dev(main, t13);
    			append_dev(main, input1);
    			append_dev(main, br16);
    			append_dev(main, t14);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	validate_slots('Welcome', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Welcome> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Welcome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/ui/ingame/Chat.svelte generated by Svelte v3.47.0 */

    const file$6 = "src/ui/ingame/Chat.svelte";

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let br0;
    	let t1;
    	let strong0;
    	let t3;
    	let br1;
    	let t4;
    	let strong1;
    	let t6;
    	let t7;
    	let input;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("this is chat!");
    			br0 = element("br");
    			t1 = space();
    			strong0 = element("strong");
    			strong0.textContent = "macimas: ";
    			t3 = text("hello");
    			br1 = element("br");
    			t4 = space();
    			strong1 = element("strong");
    			strong1.textContent = "macimas: ";
    			t6 = text("S8F RG8R UHV URH I UHREGUHRI EGRUIGH RUGIH ERUEIH RIBHEH UIFFHI FJH DJH G RDUH  EUGHUIREH UIGRH UHFD SAAAAAAAAAAAAA");
    			t7 = space();
    			input = element("input");
    			add_location(br0, file$6, 13, 15, 350);
    			add_location(strong0, file$6, 14, 2, 357);
    			add_location(br1, file$6, 14, 33, 388);
    			add_location(strong1, file$6, 15, 2, 395);
    			attr_dev(div0, "id", "messages");
    			add_location(div0, file$6, 12, 1, 315);
    			attr_dev(input, "id", "inputChat");
    			add_location(input, file$6, 17, 1, 546);
    			attr_dev(div1, "id", "chat");
    			attr_dev(div1, "class", "box");
    			add_location(div1, file$6, 11, 0, 286);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, br0);
    			append_dev(div0, t1);
    			append_dev(div0, strong0);
    			append_dev(div0, t3);
    			append_dev(div0, br1);
    			append_dev(div0, t4);
    			append_dev(div0, strong1);
    			append_dev(div0, t6);
    			append_dev(div1, t7);
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

    	window.onload = function () {
    		inputChat.onkeydown = function (chanter) {
    			if (chanter.keyCode == 13 && inputChat.value !== "") {
    				socket.emit("message", {
    					"message": inputChat.value,
    					"sender": nick
    				});

    				inputChat.value = "";
    			}
    		};
    	};

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

    /* src/ui/ingame/Coordinates.svelte generated by Svelte v3.47.0 */

    const file$5 = "src/ui/ingame/Coordinates.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "x: 0, y: 0, z:0";
    			attr_dev(div0, "id", "coords");
    			add_location(div0, file$5, 1, 1, 36);
    			attr_dev(div1, "id", "coordinates");
    			attr_dev(div1, "class", "box");
    			add_location(div1, file$5, 0, 0, 0);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Coordinates",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/ui/ingame/Palette.svelte generated by Svelte v3.47.0 */

    const file$4 = "src/ui/ingame/Palette.svelte";

    function create_fragment$5(ctx) {
    	let div31;
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

    	const block = {
    		c: function create() {
    			div31 = element("div");
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
    			set_style(div0, "background", "#6D001A");
    			set_style(div0, "width", "24px");
    			set_style(div0, "height", "24px");
    			add_location(div0, file$4, 1, 1, 32);
    			set_style(div1, "background", "#BE0039");
    			set_style(div1, "width", "24px");
    			set_style(div1, "height", "24px");
    			add_location(div1, file$4, 2, 1, 91);
    			set_style(div2, "background", "#FF4500");
    			set_style(div2, "width", "24px");
    			set_style(div2, "height", "24px");
    			add_location(div2, file$4, 3, 1, 150);
    			set_style(div3, "background", "#FFA800");
    			set_style(div3, "width", "24px");
    			set_style(div3, "height", "24px");
    			add_location(div3, file$4, 4, 1, 209);
    			set_style(div4, "background", "#FFD635");
    			set_style(div4, "width", "24px");
    			set_style(div4, "height", "24px");
    			add_location(div4, file$4, 5, 1, 268);
    			set_style(div5, "background", "#FFF8B8");
    			set_style(div5, "width", "24px");
    			set_style(div5, "height", "24px");
    			add_location(div5, file$4, 6, 1, 327);
    			set_style(div6, "background", "#00A368");
    			set_style(div6, "width", "24px");
    			set_style(div6, "height", "24px");
    			add_location(div6, file$4, 7, 1, 386);
    			set_style(div7, "background", "#00CC78");
    			set_style(div7, "width", "24px");
    			set_style(div7, "height", "24px");
    			add_location(div7, file$4, 8, 1, 445);
    			set_style(div8, "background", "#7EED56");
    			set_style(div8, "width", "24px");
    			set_style(div8, "height", "24px");
    			add_location(div8, file$4, 9, 1, 504);
    			set_style(div9, "background", "#00756F");
    			set_style(div9, "width", "24px");
    			set_style(div9, "height", "24px");
    			add_location(div9, file$4, 10, 1, 563);
    			set_style(div10, "background", "#009EAA");
    			set_style(div10, "width", "24px");
    			set_style(div10, "height", "24px");
    			add_location(div10, file$4, 11, 1, 622);
    			set_style(div11, "background", "#00CCC0");
    			set_style(div11, "width", "24px");
    			set_style(div11, "height", "24px");
    			add_location(div11, file$4, 12, 1, 681);
    			set_style(div12, "background", "#2450A4");
    			set_style(div12, "width", "24px");
    			set_style(div12, "height", "24px");
    			add_location(div12, file$4, 13, 1, 740);
    			set_style(div13, "background", "#3690EA");
    			set_style(div13, "width", "24px");
    			set_style(div13, "height", "24px");
    			add_location(div13, file$4, 14, 1, 799);
    			set_style(div14, "background", "#51E9F4");
    			set_style(div14, "width", "24px");
    			set_style(div14, "height", "24px");
    			add_location(div14, file$4, 15, 1, 858);
    			set_style(div15, "background", "#493AC1");
    			set_style(div15, "width", "24px");
    			set_style(div15, "height", "24px");
    			add_location(div15, file$4, 16, 1, 917);
    			set_style(div16, "background", "#6A5CFF");
    			set_style(div16, "width", "24px");
    			set_style(div16, "height", "24px");
    			add_location(div16, file$4, 17, 1, 976);
    			set_style(div17, "background", "#94B3FF");
    			set_style(div17, "width", "24px");
    			set_style(div17, "height", "24px");
    			add_location(div17, file$4, 18, 1, 1035);
    			set_style(div18, "background", "#811E9F");
    			set_style(div18, "width", "24px");
    			set_style(div18, "height", "24px");
    			add_location(div18, file$4, 19, 1, 1094);
    			set_style(div19, "background", "#B44AC0");
    			set_style(div19, "width", "24px");
    			set_style(div19, "height", "24px");
    			add_location(div19, file$4, 20, 1, 1153);
    			set_style(div20, "background", "#E4ABFF");
    			set_style(div20, "width", "24px");
    			set_style(div20, "height", "24px");
    			add_location(div20, file$4, 21, 1, 1212);
    			set_style(div21, "background", "#DE107F");
    			set_style(div21, "width", "24px");
    			set_style(div21, "height", "24px");
    			add_location(div21, file$4, 22, 1, 1271);
    			set_style(div22, "background", "#FF3881");
    			set_style(div22, "width", "24px");
    			set_style(div22, "height", "24px");
    			add_location(div22, file$4, 23, 1, 1330);
    			set_style(div23, "background", "#FF99AA");
    			set_style(div23, "width", "24px");
    			set_style(div23, "height", "24px");
    			add_location(div23, file$4, 24, 1, 1389);
    			set_style(div24, "background", "#6D482F");
    			set_style(div24, "width", "24px");
    			set_style(div24, "height", "24px");
    			add_location(div24, file$4, 25, 1, 1448);
    			set_style(div25, "background", "#9C6926");
    			set_style(div25, "width", "24px");
    			set_style(div25, "height", "24px");
    			add_location(div25, file$4, 26, 1, 1507);
    			set_style(div26, "background", "#FFB470");
    			set_style(div26, "width", "24px");
    			set_style(div26, "height", "24px");
    			add_location(div26, file$4, 27, 1, 1566);
    			set_style(div27, "background", "#000000");
    			set_style(div27, "width", "24px");
    			set_style(div27, "height", "24px");
    			add_location(div27, file$4, 28, 1, 1625);
    			set_style(div28, "background", "#898D90");
    			set_style(div28, "width", "24px");
    			set_style(div28, "height", "24px");
    			add_location(div28, file$4, 29, 1, 1684);
    			set_style(div29, "background", "#D4D7D9");
    			set_style(div29, "width", "24px");
    			set_style(div29, "height", "24px");
    			add_location(div29, file$4, 30, 1, 1743);
    			set_style(div30, "background", "#FFFFFF");
    			set_style(div30, "width", "24px");
    			set_style(div30, "height", "24px");
    			add_location(div30, file$4, 31, 1, 1802);
    			attr_dev(div31, "id", "palette");
    			attr_dev(div31, "class", "box");
    			add_location(div31, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div31, anchor);
    			append_dev(div31, div0);
    			append_dev(div31, t0);
    			append_dev(div31, div1);
    			append_dev(div31, t1);
    			append_dev(div31, div2);
    			append_dev(div31, t2);
    			append_dev(div31, div3);
    			append_dev(div31, t3);
    			append_dev(div31, div4);
    			append_dev(div31, t4);
    			append_dev(div31, div5);
    			append_dev(div31, t5);
    			append_dev(div31, div6);
    			append_dev(div31, t6);
    			append_dev(div31, div7);
    			append_dev(div31, t7);
    			append_dev(div31, div8);
    			append_dev(div31, t8);
    			append_dev(div31, div9);
    			append_dev(div31, t9);
    			append_dev(div31, div10);
    			append_dev(div31, t10);
    			append_dev(div31, div11);
    			append_dev(div31, t11);
    			append_dev(div31, div12);
    			append_dev(div31, t12);
    			append_dev(div31, div13);
    			append_dev(div31, t13);
    			append_dev(div31, div14);
    			append_dev(div31, t14);
    			append_dev(div31, div15);
    			append_dev(div31, t15);
    			append_dev(div31, div16);
    			append_dev(div31, t16);
    			append_dev(div31, div17);
    			append_dev(div31, t17);
    			append_dev(div31, div18);
    			append_dev(div31, t18);
    			append_dev(div31, div19);
    			append_dev(div31, t19);
    			append_dev(div31, div20);
    			append_dev(div31, t20);
    			append_dev(div31, div21);
    			append_dev(div31, t21);
    			append_dev(div31, div22);
    			append_dev(div31, t22);
    			append_dev(div31, div23);
    			append_dev(div31, t23);
    			append_dev(div31, div24);
    			append_dev(div31, t24);
    			append_dev(div31, div25);
    			append_dev(div31, t25);
    			append_dev(div31, div26);
    			append_dev(div31, t26);
    			append_dev(div31, div27);
    			append_dev(div31, t27);
    			append_dev(div31, div28);
    			append_dev(div31, t28);
    			append_dev(div31, div29);
    			append_dev(div31, t29);
    			append_dev(div31, div30);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div31);
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

    function instance$5($$self, $$props) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Palette",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/ui/ingame/Esc.svelte generated by Svelte v3.47.0 */

    const file$3 = "src/ui/ingame/Esc.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Return";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Controls";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Settings";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "Exit server";
    			attr_dev(button0, "id", "escReturn");
    			attr_dev(button0, "onclick", "escReturn()");
    			add_location(button0, file$3, 27, 1, 695);
    			attr_dev(button1, "id", "escControls");
    			attr_dev(button1, "onclick", "escControls()");
    			add_location(button1, file$3, 28, 1, 757);
    			attr_dev(button2, "id", "escSettings");
    			attr_dev(button2, "onclick", "escSettings()");
    			add_location(button2, file$3, 29, 1, 825);
    			attr_dev(button3, "id", "escExitServer");
    			attr_dev(button3, "onclick", "escExitServer()");
    			add_location(button3, file$3, 30, 1, 893);
    			attr_dev(div, "id", "esc");
    			attr_dev(div, "class", "box center");
    			add_location(div, file$3, 26, 0, 660);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(div, t5);
    			append_dev(div, button3);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Esc', slots, []);

    	document.onkeydown = function (e) {
    		if (e.key === "Escape") {
    			esc.style.display = "flex";
    			winSettings.style.display = "none";
    			winControls.style.display = "none";

    			escReturn.onclick = function escReturn() {
    				esc.style.display = "none";
    			};

    			escControls.onclick = function escControls() {
    				esc.style.display = "none";
    				winControls.style.display = "block";
    			};

    			escSettings.onclick = function escSettings() {
    				esc.style.display = "none";
    				winSettings.style.display = "block";
    			};

    			escExitServer.onclick = function escExitServer() {
    				//code for exiting server
    				esc.style.display = "none";
    			};
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Esc> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Esc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Esc",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/ui/ingame/EscMenuNavs.svelte generated by Svelte v3.47.0 */

    const file$2 = "src/ui/ingame/EscMenuNavs.svelte";

    function create_fragment$3(ctx) {
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
    	let br0;
    	let br1;
    	let current;
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
    			br0 = element("br");
    			br1 = element("br");
    			if (!src_url_equal(img0.src, img0_src_value = "./images/svgs/menu back.svg")) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$2, 14, 42, 339);
    			attr_dev(button0, "id", "escBack");
    			attr_dev(button0, "onclick", "escBack()");
    			add_location(button0, file$2, 14, 1, 298);
    			add_location(strong, file$2, 15, 1, 390);
    			if (!src_url_equal(img1.src, img1_src_value = "./images/svgs/exit.svg")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 16, 42, 457);
    			attr_dev(button1, "id", "escExit");
    			attr_dev(button1, "onclick", "escExit()");
    			add_location(button1, file$2, 16, 1, 416);
    			add_location(br0, file$2, 16, 86, 501);
    			add_location(br1, file$2, 16, 90, 505);
    			add_location(div, file$2, 13, 0, 291);
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
    			append_dev(div, br0);
    			append_dev(div, br1);
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
    	validate_slots('EscMenuNavs', slots, ['default']);

    	window.onload = function () {
    		escBack.onclick = function escBack() {
    			winSettings.style.display = "none";
    			esc.style.display = "flex";
    		};

    		escExit.onclick = function escExit() {
    			winSettings.style.display = "none";
    			winControls.style.display = "none";
    		};
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EscMenuNavs> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class EscMenuNavs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EscMenuNavs",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/ui/menu/Settings.svelte generated by Svelte v3.47.0 */

    const file$1 = "src/ui/menu/Settings.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t0;
    	let strong;
    	let br0;
    	let t2;
    	let input0;
    	let br1;
    	let t3;
    	let input1;
    	let br2;
    	let t4;
    	let input2;
    	let br3;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			strong = element("strong");
    			strong.textContent = "UI";
    			br0 = element("br");
    			t2 = text("\n\tBackground ");
    			input0 = element("input");
    			br1 = element("br");
    			t3 = text("\n\tOpacity ");
    			input1 = element("input");
    			br2 = element("br");
    			t4 = text("\n\tBlur ");
    			input2 = element("input");
    			br3 = element("br");
    			add_location(strong, file$1, 2, 1, 52);
    			add_location(br0, file$1, 2, 20, 71);
    			attr_dev(input0, "type", "color");
    			add_location(input0, file$1, 3, 12, 88);
    			add_location(br1, file$1, 3, 32, 108);
    			attr_dev(input1, "id", "bgopacity");
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			input1.value = "64";
    			add_location(input1, file$1, 4, 9, 122);
    			add_location(br2, file$1, 4, 74, 187);
    			attr_dev(input2, "id", "bgblur");
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "6");
    			input2.value = "6";
    			add_location(input2, file$1, 5, 6, 198);
    			add_location(br3, file$1, 5, 65, 257);
    			attr_dev(div, "id", "winSettings");
    			attr_dev(div, "class", "box center");
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
    			append_dev(div, strong);
    			append_dev(div, br0);
    			append_dev(div, t2);
    			append_dev(div, input0);
    			append_dev(div, br1);
    			append_dev(div, t3);
    			append_dev(div, input1);
    			append_dev(div, br2);
    			append_dev(div, t4);
    			append_dev(div, input2);
    			append_dev(div, br3);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
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

    /* src/ui/menu/Controls.svelte generated by Svelte v3.47.0 */

    const file = "src/ui/menu/Controls.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;
    	let br3;
    	let t4;
    	let br4;
    	let t5;
    	let br5;
    	let t6;
    	let br6;
    	let t7;
    	let br7;
    	let br8;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = text("\n\tWASD - Move");
    			br0 = element("br");
    			t1 = text("\n\tSpace - Fly up");
    			br1 = element("br");
    			t2 = text("\n\tShift - Fly down");
    			br2 = element("br");
    			t3 = text("\n\tX - Place cubes");
    			br3 = element("br");
    			t4 = text("\n\tC - Break cubes");
    			br4 = element("br");
    			t5 = text("\n\tG - Toggle grid");
    			br5 = element("br");
    			t6 = text("\n\tEnter - Open chat");
    			br6 = element("br");
    			t7 = text("\n\tL - Open settings");
    			br7 = element("br");
    			br8 = element("br");
    			add_location(br0, file, 2, 12, 63);
    			add_location(br1, file, 3, 15, 83);
    			add_location(br2, file, 4, 17, 105);
    			add_location(br3, file, 5, 16, 126);
    			add_location(br4, file, 6, 16, 147);
    			add_location(br5, file, 7, 16, 168);
    			add_location(br6, file, 8, 18, 191);
    			add_location(br7, file, 9, 18, 214);
    			add_location(br8, file, 9, 22, 218);
    			attr_dev(div, "id", "winControls");
    			attr_dev(div, "class", "box center");
    			add_location(div, file, 0, 0, 0);
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
    			append_dev(div, t3);
    			append_dev(div, br3);
    			append_dev(div, t4);
    			append_dev(div, br4);
    			append_dev(div, t5);
    			append_dev(div, br5);
    			append_dev(div, t6);
    			append_dev(div, br6);
    			append_dev(div, t7);
    			append_dev(div, br7);
    			append_dev(div, br8);
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.47.0 */

    // (18:10) <EscMenuNavs>
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
    		source: "(18:10) <EscMenuNavs>",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Settings>
    function create_default_slot_2(ctx) {
    	let escmenunavs;
    	let current;

    	escmenunavs = new EscMenuNavs({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(escmenunavs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(escmenunavs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const escmenunavs_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				escmenunavs_changes.$$scope = { dirty, ctx };
    			}

    			escmenunavs.$set(escmenunavs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(escmenunavs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(escmenunavs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(escmenunavs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(18:0) <Settings>",
    		ctx
    	});

    	return block;
    }

    // (19:10) <EscMenuNavs>
    function create_default_slot_1(ctx) {
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(19:10) <EscMenuNavs>",
    		ctx
    	});

    	return block;
    }

    // (19:0) <Controls>
    function create_default_slot(ctx) {
    	let escmenunavs;
    	let current;

    	escmenunavs = new EscMenuNavs({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(escmenunavs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(escmenunavs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const escmenunavs_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				escmenunavs_changes.$$scope = { dirty, ctx };
    			}

    			escmenunavs.$set(escmenunavs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(escmenunavs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(escmenunavs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(escmenunavs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(19:0) <Controls>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let welcome;
    	let t0;
    	let chat;
    	let t1;
    	let coordinates;
    	let t2;
    	let palette;
    	let t3;
    	let esc;
    	let t4;
    	let settings;
    	let t5;
    	let controls;
    	let current;
    	welcome = new Welcome({ $$inline: true });
    	chat = new Chat({ $$inline: true });
    	coordinates = new Coordinates({ $$inline: true });
    	palette = new Palette({ $$inline: true });
    	esc = new Esc({ $$inline: true });

    	settings = new Settings({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	controls = new Controls({
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
    			create_component(chat.$$.fragment);
    			t1 = space();
    			create_component(coordinates.$$.fragment);
    			t2 = space();
    			create_component(palette.$$.fragment);
    			t3 = space();
    			create_component(esc.$$.fragment);
    			t4 = space();
    			create_component(settings.$$.fragment);
    			t5 = space();
    			create_component(controls.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(welcome, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(chat, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(coordinates, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(palette, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(esc, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(settings, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(controls, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const settings_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				settings_changes.$$scope = { dirty, ctx };
    			}

    			settings.$set(settings_changes);
    			const controls_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				controls_changes.$$scope = { dirty, ctx };
    			}

    			controls.$set(controls_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(welcome.$$.fragment, local);
    			transition_in(chat.$$.fragment, local);
    			transition_in(coordinates.$$.fragment, local);
    			transition_in(palette.$$.fragment, local);
    			transition_in(esc.$$.fragment, local);
    			transition_in(settings.$$.fragment, local);
    			transition_in(controls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(welcome.$$.fragment, local);
    			transition_out(chat.$$.fragment, local);
    			transition_out(coordinates.$$.fragment, local);
    			transition_out(palette.$$.fragment, local);
    			transition_out(esc.$$.fragment, local);
    			transition_out(settings.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(welcome, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(chat, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(coordinates, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(palette, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(esc, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(settings, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(controls, detaching);
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
    		Welcome,
    		Chat,
    		Coordinates,
    		Palette,
    		Esc,
    		EscMenuNavs,
    		Settings,
    		Controls
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
    		name: 'world'
    	},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
