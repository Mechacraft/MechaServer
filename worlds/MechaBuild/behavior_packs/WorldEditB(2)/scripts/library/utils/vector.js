export class Vector {
    constructor(x, y, z) {
        this.vals = [0, 0, 0];
        this.vals = [x, y, z];
    }
    static get ZERO() { return new Vector(0, 0, 0); }
    static get ONE() { return new Vector(1, 1, 1); }
    static get INF() { return new Vector(Infinity, Infinity, Infinity); }
    static get NEG_INF() { return new Vector(-Infinity, -Infinity, -Infinity); }
    static from(loc) {
        if (Array.isArray(loc)) {
            return new Vector(...loc);
        }
        return new Vector(loc.x, loc.y, loc.z);
    }
    static add(a, b) {
        return Vector.from(a).add(b);
    }
    static sub(a, b) {
        return Vector.from(a).sub(b);
    }
    static min(a, b) {
        return Vector.from(a).min(b);
    }
    static max(a, b) {
        return Vector.from(a).max(b);
    }
    get x() { return this.vals[0]; }
    set x(val) { this.vals[0] = val; }
    get y() { return this.vals[1]; }
    set y(val) { this.vals[1] = val; }
    get z() { return this.vals[2]; }
    set z(val) { this.vals[2] = val; }
    get lengthSqr() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    set length(val) {
        const len = this.length;
        this.x = this.x / len * val;
        this.y = this.y / len * val;
        this.z = this.z / len * val;
    }
    getIdx(idx) {
        return this.vals[idx];
    }
    setIdx(idx, val) {
        this.vals[idx] = val;
    }
    clone() {
        return new Vector(...this.vals);
    }
    equals(v) {
        v = Vector.from(v);
        return this.x == v.x && this.y == v.y && this.z == v.z;
    }
    offset(x, y, z) {
        return new Vector(this.x + x, this.y + y, this.z + z);
    }
    add(v) {
        if (typeof v == "number") {
            return new Vector(this.x + v, this.y + v, this.z + v);
        }
        else {
            v = Vector.from(v);
            return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
        }
    }
    sub(v) {
        if (typeof v == "number") {
            return new Vector(this.x - v, this.y - v, this.z - v);
        }
        else {
            v = Vector.from(v);
            return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
        }
    }
    mul(v) {
        if (typeof v == "number") {
            return new Vector(this.x * v, this.y * v, this.z * v);
        }
        else {
            v = Vector.from(v);
            return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
        }
    }
    div(v) {
        if (typeof v == "number") {
            return new Vector(this.x / v, this.y / v, this.z / v);
        }
        else {
            v = Vector.from(v);
            return new Vector(this.x / v.x, this.y / v.y, this.z / v.z);
        }
    }
    rotateX(rot, org = Vector.ZERO) {
        if (!rot)
            return this.clone();
        org = Vector.from(org);
        const y = this.y - org.y;
        const z = this.z - org.z;
        const ang = rot * (Math.PI / 180);
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        return new Vector(this.x, Math.round(10000 * (y * cos - z * sin)) / 10000 + org.y, Math.round(10000 * (y * sin + z * cos)) / 10000 + org.z);
    }
    rotateY(rot, org = Vector.ZERO) {
        if (!rot)
            return this.clone();
        org = Vector.from(org);
        const x = this.x - org.x;
        const z = this.z - org.z;
        const ang = rot * (Math.PI / 180);
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        return new Vector(Math.round(10000 * (x * cos - z * sin)) / 10000 + org.x, this.y, Math.round(10000 * (x * sin + z * cos)) / 10000 + org.z);
    }
    rotateZ(rot, org = Vector.ZERO) {
        if (!rot)
            return this.clone();
        org = Vector.from(org);
        const x = this.x - org.x;
        const y = this.y - org.y;
        const ang = rot * (Math.PI / 180);
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        return new Vector(Math.round(10000 * (x * cos - y * sin)) / 10000 + org.x, Math.round(10000 * (x * sin + y * cos)) / 10000 + org.y, this.z);
    }
    min(v) {
        v = Vector.from(v);
        return new Vector(Math.min(this.x, v.x), Math.min(this.y, v.y), Math.min(this.z, v.z));
    }
    max(v) {
        v = Vector.from(v);
        return new Vector(Math.max(this.x, v.x), Math.max(this.y, v.y), Math.max(this.z, v.z));
    }
    floor() {
        return new Vector(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    }
    ceil() {
        return new Vector(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z));
    }
    round() {
        return new Vector(Math.round(this.x), Math.round(this.y), Math.round(this.z));
    }
    lerp(v, t) {
        v = Vector.from(v);
        return new Vector((1 - t) * this.x + t * v.x, (1 - t) * this.y + t * v.y, (1 - t) * this.z + t * v.z);
    }
    abs() {
        return new Vector(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
    }
    normalized() {
        const vec = new Vector(...this.vals);
        vec.length = 1;
        return vec;
    }
    dot(v) {
        v = Vector.from(v);
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    print() {
        return `${this.x} ${this.y} ${this.z}`;
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
    *[Symbol.iterator]() {
        yield this.vals[0];
        yield this.vals[1];
        yield this.vals[2];
    }
}
Vector.prototype.toString = function () {
    return `(${this.vals[0]}, ${this.vals[1]}, ${this.vals[2]})`;
};
