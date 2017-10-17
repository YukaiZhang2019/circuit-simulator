// import collection from 'src/vuex/collection';
// import { outputAll } from 'src/lib/map';
// import assert from './assertion';
import { PointLike } from './point';

// 全局常量
const doc = document, NS = window.$DATA.SVG_NS;

// 开关
const Switch = {
    point: true,
    path: true,
    text: true,
};

// 点颜色
// const nodeColor = {
//     'line': 'green',
//     'part': 'black',
//     'part-point': 'red',
//     'line-point': 'orange',
//     'cross-point': 'blue',
//     'cover-point': 'yellow',
// };

class MapDebug {
    /**
     * 每个实例都将直接操作此 SVG 元素
     * @type {SVGGElement}
     */
    $el: SVGGElement;

    constructor() {
        this.$el = doc.createElementNS(NS, 'g');
        this.$el.setAttribute('class', 'map-debugger');
    }
    point([x, y]: PointLike, color: string = 'black', mul: number = 1): void {
        if (!Switch.point) {
            return;
        }

        const el = doc.createElementNS(NS, 'circle');
        el.setAttribute('stroke-width', '3');
        el.setAttribute('fill', 'transparent');
        el.setAttribute('class', 'debug-point');
        el.setAttribute('stroke', color);
        el.setAttribute('cx', String(x * mul));
        el.setAttribute('cy', String(y * mul));
        el.setAttribute('r', '4');

        this.$el.appendChild(el);
    }
    path(way: PointLike[], color: string = 'black') {
        if (!Switch.point) {
            return;
        }

        const el = doc.createElementNS(NS, 'path');
        el.setAttribute('d', `M${way.map((point) => point.join(',')).join('L')}`);
        el.setAttribute('class', 'debug-path');
        el.setAttribute('stroke-width', '2');
        el.setAttribute('fill', 'transparent');
        el.setAttribute('stroke', color);

        this.$el.appendChild(el);
    }
    text([x, y]: PointLike, text: string, mul: number = 1) {
        const el = doc.createElementNS(NS, 'text');

        el.textContent = text;
        el.setAttribute('x', String(x * mul));
        el.setAttribute('y', String(y * mul));
        el.setAttribute('fill', '#3B4449');
        el.setAttribute('font-size', '14');
        el.setAttribute('stroke-width', '0');
        el.setAttribute('class', 'debug-text');

        this.$el.appendChild(el);
    }
    clearPoint() {
        Array
            .from(this.$el.querySelectorAll('.debug-point'))
            .forEach((el) => el.remove());
    }
    clearAll() {
        this.$el.innerHTML = '';
    }
    // whole() {
    //     let count = 0;
    //     collection.state.Lines.forEach((line) => {
    //         this.text(
    //             [1000, count * 25 + 50],
    //             `${line.connect[0]} ---> ${line.id} ---> ${line.connect[1]}`,
    //         );
    //         count++;
    //     });
    //     count++;

    //     const points = outputAll();

    //     points.forEach((status) => {
    //         const point = status.point;
    //         // 点本身
    //         this.point(point, nodeColor[status.type], 20);
    //         // 点的 ID
    //         if (status.type === 'line') {
    //             this.text(point, status.id.split('_')[1], 20);
    //         } else if (status.type === 'part-point') {
    //             this.text([point[0], point[1] - 0.5], status.id, 20);
    //         } else if (/(cross-point|cover-point)/.test(status.type)) {
    //             this.path([[point[0] * 20, point[1] * 20], [1000, count * 25 + 50]], '#222222');
    //             this.text([1000, count * 25 + 50], status.id);
    //             count++;
    //         }
    //         // 点的连接关系
    //         status.connect && status.connect.forEach(([tx, ty]) => {
    //             const [x, y] = point;

    //             if (x - tx < 0) {
    //                 this.path([[x * 20, y * 20 - 3], [tx * 20, ty * 20 - 3]]);
    //             } else if (x - tx > 0) {
    //                 this.path([[x * 20, y * 20 + 3], [tx * 20, ty * 20 + 3]]);
    //             } else if (y - ty < 0) {
    //                 this.path([[x * 20 - 3, y * 20], [tx * 20 - 3, ty * 20]]);
    //             } else if (y - ty > 0) {
    //                 this.path([[x * 20 + 3, y * 20], [tx * 20 + 3, ty * 20]]);
    //             }
    //         });
    //     });
    // }
}

export default MapDebug;
