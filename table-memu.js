(function () {
    class Rect {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
    }

    const SELECTED_TD_CLASS = 'selected-td';
    var tableElement = document.querySelector('table');
    var mouseSelection = document.querySelector('.mouse-selection');
    var isTable = false;
    var tdRectMaps, startPos, startRect;

    bindEvent();

    function bindEvent() {
        bindTableEvent();

        bindTableMemuEvent();
    }

    /**
     * 绑定表格元素事件
     * @author 肖乐 <2104553252@qq.com>
     * @data 2019-06-28
     */
    function bindTableEvent() {
        tableElement.addEventListener('contextmenu', e => {
        });

        tableElement.addEventListener("mousedown", e => {
            if (!isTable) {
                isTable = true;
                tdRectMaps = resolveTable(e.currentTarget);
                startPos = {x: e.pageX, y: e.pageY};
            }

        });

        tableElement.addEventListener("mousemove", e => {
            if (isTable) {
                mousemoveRect(e);
                selectdTd();
            }
        });

        tableElement.addEventListener("mouseup", e => {
            isTable = false;
            mouseSelection.removeAttribute("style");
        });
    }

    /**
     * 绑定表格按钮区事件
     * @param mod
     * @author 肖乐 <2104553252@qq.com>
     * @data 2019-06-28
     */
    function bindTableMemuEvent() {
        const box = document.querySelector('.table-memu-box');

        const mergeCellBtn = box.querySelector('.merge-cell');
        mergeCellBtn.addEventListener('click', mergeCell);

        const cancelMergeCellBtn = box.querySelector('.cancel-merge-cell');
        cancelMergeCellBtn.addEventListener('click', cancelMergeCell);
    }

    /**
     * 合并选中单元格
     * @author 肖乐 <2104553252@qq.com>
     * @data 2019-06-28
     */
    function mergeCell() {
        let tds = [...tableElement.querySelectorAll(`.${SELECTED_TD_CLASS}`)];
        let startTd = tds.shift();
        let endTd = tds[tds.length - 1];
        const startTdRowIndex = startTd.parentElement.rowIndex;
        const startTdCellIndex = startTd.cellIndex;

        const endTdRowIndex = endTd.parentElement.rowIndex;
        const endTdCellIndex = endTd.cellIndex;

        const rowSpan = endTdRowIndex - startTdRowIndex + 1;
        const colSpan = endTdCellIndex - startTdCellIndex + 1;

        startTd.rowSpan = rowSpan;
        startTd.colSpan = colSpan;

        startTd.style.width = `${colSpan * 200}px`;

        tds.forEach(td => {
            td.remove();
        })
    }

    /**
     * 取消合并单元格
     * @author 肖乐 <2104553252@qq.com>
     * @data 2019-06-29
     */
    function cancelMergeCell() {
        let tds = [...tableElement.querySelectorAll(`.${SELECTED_TD_CLASS}`)];
        if (tds.length > 1) {
            console.warn('选中了多个td，无法取消合并单元格');
            return;
        }

        const cancelMergeCell = tds.shift();
        const cancelMergeRow = cancelMergeCell.parentElement;
        const {rowSpan, colSpan, cellIndex} = cancelMergeCell;

        if (rowSpan == 1 && colSpan == 1) return;

        let currentRow = cancelMergeRow;
        for (let i = 0; i < rowSpan; i++) {
            let j = i == 0 ? 1 : 0;
            for (; j < colSpan; j++) {
                const createCellIndex = cellIndex + j;
                currentRow.insertCell(createCellIndex);
            }
            currentRow = currentRow.nextElementSibling;
        }

        cancelMergeCell.rowSpan = 1;
        cancelMergeCell.colSpan = 1;
        cancelMergeCell.removeAttribute('style')
    }

    /**
     * 鼠标移动的矩阵
     * @author 肖乐 <2104553252@qq.com>
     * @data 2019-06-28
     */
    function mousemoveRect(e) {
        // 计算鼠标移动的矩形
        let {pageX, pageY} = e;
        let width = startPos.x - pageX;
        let height = startPos.y - pageY;
        if (width < 0 && height < 0) {// 鼠标右下移动
            startRect = new Rect(startPos.x, startPos.y, Math.abs(width), Math.abs(height));
        } else if (width < 0 && height > 0) { // 鼠标右上移动
            startRect = new Rect(startPos.x, pageY, Math.abs(width), Math.abs(height));
        } else if (width > 0 && height > 0) { // 鼠标左上移动
            startRect = new Rect(pageX, pageY, width, height);
        } else {// 鼠标左下移动
            startRect = new Rect(pageX, startPos.y, Math.abs(width), Math.abs(height));
        }

        // 显示鼠标移动矩形
        // mouseSelection.style.left = `${startRect.x}px`;
        // mouseSelection.style.top = `${startRect.y}px`;
        // mouseSelection.style.width = `${startRect.width}px`;
        // mouseSelection.style.height = `${startRect.height}px`;
    }

    /**
     * 鼠标移动矩阵和表格cell重叠的td
     * @author 肖乐 <2104553252@qq.com>
     * @data 2019-06-28
     */
    function selectdTd() {
        // 标识鼠标扫过的td
        for (var [key, value] of tdRectMaps) {
            if (isOverlap(startRect, value)) {
                key.classList.add(SELECTED_TD_CLASS);
            } else {
                key.classList.remove(SELECTED_TD_CLASS);
            }
        }
    }

    /**
     * 计算表格td的矩阵数据
     * @param table
     * @author 肖乐 <2104553252@qq.com>
     * @data 2019-06-28
     */
    function resolveTable(table) {
        let tds = table.querySelectorAll("td");
        const tdRectMaps = new Map();
        [...tds].forEach(td => {
            const DOMRect = td.getClientRects()[0];
            const tdRect = new Rect(DOMRect.x, DOMRect.y, DOMRect.width, DOMRect.height);
            tdRectMaps.set(td, tdRect);
        });
        return tdRectMaps;
    }

    /**
     * @brief 判断两个轴对齐的矩形是否重叠
     * @param source 第一个矩阵的位置
     * @param target 第二个矩阵的位置
     * @return 两个矩阵是否重叠（边沿重叠，也认为是重叠）
     */
    function isOverlap(source, target) {
        if (source.x + source.width > target.x &&
            target.x + target.width > source.x &&
            source.y + source.height > target.y &&
            target.y + target.height > source.y
        ) {
            return true;
        } else {
            return false;
        }
    }
})();

