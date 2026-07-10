/**

 * 6号自动化助手 - 流程编辑器

 */

const _API_TOKEN = new URLSearchParams(window.location.search).get('_token') || '';
const _origFetch = window.fetch;
window.fetch = function(url, opts = {}) {
    if (typeof url === 'string' && url.startsWith('/api/')) {
        opts.headers = Object.assign({}, opts.headers, {'X-Api-Token': _API_TOKEN});
    }
    return _origFetch.call(this, url, opts);
};

// ==================== 自定义消息弹窗 ====================



let msgDialogResolve = null;



function showMsg(text, type = 'success') {

    const dialog = document.getElementById('msg-dialog');

    const icon = document.getElementById('msg-icon');

    const textEl = document.getElementById('msg-text');

    const buttons = document.getElementById('msg-buttons');

    

    // 标记正在显示对话框，避免滚动位置被重置

    isShowingDialog = true;

    

    // 设置图标

    icon.className = 'msg-icon ' + type;

    if (type === 'success') icon.textContent = '✓';

    else if (type === 'warning') icon.textContent = '⚠';

    else if (type === 'error') icon.textContent = '✕';

    else if (type === 'question') icon.textContent = '?';

    

    textEl.textContent = text;

    buttons.innerHTML = '<button class="btn btn-primary" onclick="closeMsgDialog(true)">确定</button>';

    

    dialog.style.display = 'flex';

}



function showConfirm(text) {

    return new Promise((resolve) => {

        const dialog = document.getElementById('msg-dialog');

        const icon = document.getElementById('msg-icon');

        const textEl = document.getElementById('msg-text');

        const buttons = document.getElementById('msg-buttons');

        

        icon.className = 'msg-icon question';

        icon.textContent = '?';

        textEl.textContent = text;

        buttons.innerHTML = `

            <button class="btn btn-primary" onclick="closeMsgDialog(true)">确定</button>

            <button class="btn" onclick="closeMsgDialog(false)">取消</button>

        `;

        

        msgDialogResolve = resolve;

        dialog.style.display = 'flex';

    });

}



function closeMsgDialog(result) {

    document.getElementById('msg-dialog').style.display = 'none';

    // 延迟清除标志，确保scroll事件不会在对话框关闭时错误更新位置

    setTimeout(() => { isShowingDialog = false; }, 100);

    if (msgDialogResolve) {

        msgDialogResolve(result);

        msgDialogResolve = null;

    }

}



// 步骤类型配置

const STEP_TYPES = {

    // 鼠标操作

    click: {

        name: '鼠标点击',

        icon: '👆',

        category: 'mouse',

        fields: [

            { name: 'button', label: '按键', type: 'select', options: ['left', 'right', 'middle'], default: 'left' },

            { name: 'clicks', label: '点击次数', type: 'number', default: 1 },

            { name: 'hold_time', label: '按住时间(秒)', type: 'number', default: 0, step: 0.1, min: 0, hint: '0表示立即释放' }

        ]

    },

    double_click: {

        name: '双击',

        icon: '👆👆',

        category: 'mouse',

        fields: []

    },

    right_click: {

        name: '右键点击',

        icon: '🖱️',

        category: 'mouse',

        fields: []

    },

    move: {

        name: '移动鼠标',

        icon: '➡️',

        category: 'mouse',

        fields: [

            { name: 'x', label: 'X坐标', type: 'number', default: 0 },

            { name: 'y', label: 'Y坐标', type: 'number', default: 0 },

            { name: 'duration', label: '移动时间(秒)', type: 'number', default: 0.2, step: 0.1 }

        ]

    },

    drag: {

        name: '拖拽',

        icon: '↔️',

        category: 'mouse',

        fields: [

            { name: 'start_x', label: '起始X', type: 'number', default: 0 },

            { name: 'start_y', label: '起始Y', type: 'number', default: 0 },

            { name: 'end_x', label: '结束X', type: 'number', default: 0 },

            { name: 'end_y', label: '结束Y', type: 'number', default: 0 },

            { name: 'duration', label: '拖拽时间(秒)', type: 'number', default: 0.5, step: 0.1 }

        ]

    },

    scroll: {

        name: '滚轮',

        icon: '🔃',

        category: 'mouse',

        fields: [

            { name: 'clicks', label: '滚动格数(正=上,负=下)', type: 'number', default: 3 },

            { name: 'x', label: 'X坐标(可选)', type: 'number', default: null },

            { name: 'y', label: 'Y坐标(可选)', type: 'number', default: null }

        ]

    },

    fps_move: {

        name: 'FPS视角移动',

        icon: '🎮',

        category: 'mouse',

        fields: [

            { name: 'dx', label: '水平移动(正=右,负=左)', type: 'number', default: 0, hint: '基于标准DPI(1000)的像素值，软件会自动根据你的DPI换算' },

            { name: 'dy', label: '垂直移动(正=下,负=上)', type: 'number', default: 0, hint: '基于标准DPI(1000)的像素值，软件会自动根据你的DPI换算' },

            { name: 'duration', label: '移动时间(秒)', type: 'number', default: 0.1, step: 0.05, min: 0 },

            { name: 'steps', label: '平滑步数', type: 'number', default: 10, min: 1, hint: '越大越平滑' }

        ]

    },

    

    // 键盘操作

    type: {

        name: '输入文本',

        icon: '📝',

        category: 'keyboard',

        fields: [

            { name: 'text', label: '文本内容', type: 'textarea', default: '' },

            { name: 'interval', label: '输入间隔(秒)', type: 'number', default: 0.05, step: 0.01 }

        ]

    },

    press: {

        name: '按键',

        icon: '⬇️',

        category: 'keyboard',

        fields: [

            { name: 'key', label: '按键名', type: 'text', default: 'enter', hint: '如: enter, tab, space, esc, f1-f12' },

            { name: 'hold_time', label: '按住时间(秒)', type: 'number', default: 0, step: 0.1, min: 0, hint: '0表示立即释放' }

        ]

    },

    hotkey: {

        name: '组合键',

        icon: '🔧',

        category: 'keyboard',

        fields: [

            { name: 'keys', label: '按键组合', type: 'text', default: 'ctrl,c', hint: '用逗号分隔，如: ctrl,c 或 ctrl,shift,s' },

            { name: 'hold_time', label: '按住时间(秒)', type: 'number', default: 0, step: 0.1, min: 0, hint: '0表示立即释放' }

        ]

    },

    key_down: {

        name: '按下按键',

        icon: '🔽',

        category: 'keyboard',

        fields: [

            { name: 'key', label: '按键', type: 'text', default: 'left', hint: '键盘键(如 a, space, shift)或鼠标键(left, right, middle)，按住不放直到遇到"松开按键"或脚本结束' }

        ]

    },

    key_release: {

        name: '松开按键',

        icon: '🔼',

        category: 'keyboard',

        fields: []

    },

    

    // 图像识别

    image_find: {

        name: '图片识别',

        icon: '🔍',

        category: 'image',

        fields: [

            { name: 'image', label: '图片文件名', type: 'text', default: '' },

            { name: 'confidence', label: '置信度', type: 'number', default: 0.8, step: 0.05, min: 0.5, max: 1 },

            { name: 'offset_x', label: 'X偏移', type: 'number', default: 0 },

            { name: 'offset_y', label: 'Y偏移', type: 'number', default: 0 },

            { name: 'max_wait', label: '最大等待(秒)', type: 'number', default: 10 },

            { name: 'move_duration', label: '移动时间(秒)', type: 'number', default: 0.2, step: 0.1 }

        ]

    },

    image_click: {

        name: '图片点击',

        icon: '🎯',

        category: 'image',

        fields: [

            { name: 'image', label: '图片文件名', type: 'text', default: '' },

            { name: 'confidence', label: '置信度', type: 'number', default: 0.8, step: 0.05, min: 0.5, max: 1 },

            { name: 'offset_x', label: 'X偏移', type: 'number', default: 0 },

            { name: 'offset_y', label: 'Y偏移', type: 'number', default: 0 },

            { name: 'max_wait', label: '最大等待(秒)', type: 'number', default: 10 },

            { name: 'button', label: '按键', type: 'select', options: ['left', 'right'], default: 'left' },

            { name: 'click_delay', label: '点击前延迟(秒)', type: 'number', default: 1.0, step: 0.1, min: 0 }

        ]

    },

    image_click_ocr: {

        name: 'OCR图片点击',

        icon: '🔤',

        category: 'image',

        fields: [

            { name: 'image', label: '图片文件名', type: 'text', default: '' },

            { name: 'ocr_text', label: '验证文字', type: 'text', default: '' },

            { name: 'confidence', label: '置信度', type: 'number', default: 0.8, step: 0.05, min: 0.5, max: 1 },

            { name: 'offset_x', label: 'X偏移', type: 'number', default: 0 },

            { name: 'offset_y', label: 'Y偏移', type: 'number', default: 0 },

            { name: 'max_wait', label: '最大等待(秒)', type: 'number', default: 10 },

            { name: 'button', label: '按键', type: 'select', options: ['left', 'right'], default: 'left' },

            { name: 'click_delay', label: '点击前延迟(秒)', type: 'number', default: 1.0, step: 0.1, min: 0 },

            { name: 'ocr_expand', label: 'OCR扩展区域(像素)', type: 'number', default: 20, min: 0 }

        ]

    },

    wait_image: {

        name: '等待图片出现',

        icon: '👁️',

        category: 'image',

        fields: [

            { name: 'image', label: '图片文件名', type: 'text', default: '' },

            { name: 'confidence', label: '置信度', type: 'number', default: 0.8, step: 0.05, min: 0.5, max: 1 },

            { name: 'timeout', label: '超时时间(秒)', type: 'number', default: 30 }

        ]

    },

    wait_image_disappear: {

        name: '等待图片消失',

        icon: '🚫',

        category: 'image',

        fields: [

            { name: 'image', label: '图片文件名', type: 'text', default: '' },

            { name: 'confidence', label: '置信度', type: 'number', default: 0.8, step: 0.05, min: 0.5, max: 1 },

            { name: 'timeout', label: '超时时间(秒)', type: 'number', default: 30 }

        ]

    },

    continuous_click: {

        name: '常驻点击',

        icon: '🔄',

        category: 'image',

        fields: [

            { name: 'image', label: '图片文件名', type: 'text', default: '' },

            { name: 'confidence', label: '置信度', type: 'number', default: 0.8, step: 0.05, min: 0.5, max: 1 },

            { name: 'offset_x', label: 'X偏移', type: 'number', default: 0 },

            { name: 'offset_y', label: 'Y偏移', type: 'number', default: 0 },

            { name: 'interval', label: '检测间隔(秒)', type: 'number', default: 0.5, step: 0.1, min: 0.2 },

            { name: 'click_interval', label: '执行后等待(秒)', type: 'number', default: 1, step: 0.5, min: 0 },

            { name: 'click_delay', label: '执行前延迟(秒)', type: 'number', default: 1.0, step: 0.1, min: 0 },

            { name: 'action_type', label: '操作类型', type: 'select', options: ['click', 'key'], default: 'click' },

            { name: 'button', label: '鼠标按键', type: 'select', options: ['left', 'right', 'middle', 'none'], default: 'left' },

            { name: 'key', label: '键盘按键', type: 'text', default: '', hint: '例: space, enter, f1, ctrl+c' },

            { name: 'hold_time', label: '按住时长(秒)', type: 'number', default: 0, step: 0.1, min: 0, hint: '0表示立即释放，>0表示按住指定时间后松开' }

        ]

    },

    change_detection: {

        name: '变换识别',

        icon: '🎯',

        category: 'image',

        fields: [

            { name: 'regions', label: '监控区域', type: 'region_list', default: [] },

            { name: 'timeout', label: '检测超时(秒)', type: 'number', default: 10, step: 1, min: 1 },

            { name: 'scan_interval', label: '扫描间隔(秒)', type: 'number', default: 0.2, step: 0.1, min: 0.1 },

            { name: 'batch_delay', label: '批量延迟(秒)', type: 'number', default: 0.5, step: 0.1, min: 0 }

        ]

    },

    color_check: {

        name: '颜色识别',

        icon: '🎨',

        category: 'image',

        fields: [

            { name: 'x', label: 'X坐标', type: 'number', default: 0 },

            { name: 'y', label: 'Y坐标', type: 'number', default: 0 },

            { name: 'target_color', label: '目标颜色(RGB)', type: 'color', default: [255, 255, 255] },

            { name: 'tolerance', label: '颜色容差', type: 'number', default: 30, min: 0, max: 255, hint: '允许的颜色偏差范围' },

            { name: 'sample_size', label: '采样区域', type: 'number', default: 3, min: 1, max: 20, hint: '取N×N像素平均值' },

            { name: 'timeout', label: '检测超时(秒)', type: 'number', default: 0, min: 0, step: 1, hint: '0=只检测一次，>0=循环检测直到匹配或超时' },

            { name: 'interval', label: '检测间隔(秒)', type: 'number', default: 0.5, min: 0.1, step: 0.1, hint: '循环检测时的间隔时间', condition: { field: 'timeout', notValue: 0 } },

            { name: 'on_match', label: '匹配时', type: 'select', options: ['continue', 'stop', 'jump'], default: 'continue' },

            { name: 'match_jump_group', label: '匹配跳转组合', type: 'number', default: 0, condition: { field: 'on_match', value: 'jump' } },

            { name: 'on_mismatch', label: '不匹配时', type: 'select', options: ['continue', 'stop', 'jump'], default: 'continue', condition: { field: 'timeout', value: 0 } },

            { name: 'mismatch_jump_group', label: '不匹配跳转组合', type: 'number', default: 0, condition: { field: 'on_mismatch', value: 'jump' } },

            { name: 'on_timeout', label: '超时时', type: 'select', options: ['continue', 'stop', 'jump'], default: 'continue', condition: { field: 'timeout', notValue: 0 } },

            { name: 'timeout_jump_group', label: '超时跳转组合', type: 'number', default: 0, condition: { field: 'on_timeout', value: 'jump' } }

        ]

    },
    pixel_position: {
        name: '像素级定位',
        icon: '🎯',
        category: 'image',
        fields: [
            { name: 'image_coord', label: '图片和坐标', type: 'text', default: '', hint: '粘贴格式: 图片名|x,y,w,h' },
            { name: 'image', label: '参考图片', type: 'text', default: '' },
            { name: 'target_x', label: '目标X', type: 'number', default: 0 },
            { name: 'target_y', label: '目标Y', type: 'number', default: 0 },
            { name: 'tolerance', label: '误差范围(px)', type: 'number', default: 5, min: 1 },
            { name: 'ms_per_pixel', label: '每像素毫秒', type: 'number', default: 10, min: 1, hint: '按键时长=偏移像素×此值' },
            { name: 'confidence', label: '置信度', type: 'number', default: 0.8, min: 0.1, max: 1, step: 0.05 },
            { name: 'max_attempts', label: '最大尝试次数', type: 'number', default: 20, min: 1 },
            { name: 'key_up', label: '上键', type: 'text', default: 'w' },
            { name: 'key_down', label: '下键', type: 'text', default: 's' },
            { name: 'key_left', label: '左键', type: 'text', default: 'a' },
            { name: 'key_right', label: '右键', type: 'text', default: 'd' }
        ]
    },

    // 控制流程

    delay: {

        name: '延迟等待',

        icon: '⏰',

        category: 'control',

        fields: [

            { name: 'ms', label: '延迟时间(毫秒)', type: 'number', default: 1000 }

        ]

    },

    log: {

        name: '日志输出',

        icon: '📋',

        category: 'control',

        fields: [

            { name: 'message', label: '日志内容', type: 'text', default: '' }

        ]

    },

    jump_group: {

        name: '跳转组合',

        icon: '↪️',

        category: 'control',

        fields: [

            { name: 'target_group', label: '目标组合', type: 'number', default: 0 }

        ]

    },

    call_group: {

        name: '调用组合',

        icon: '📞',

        category: 'control',

        fields: [

            { name: 'target_group', label: '调用目标组合', type: 'number', default: 0 },

            { name: 'return_mode', label: '返回模式', type: 'select', options: ['current', 'custom'], default: 'current', hint: 'current=返回当前位置，custom=自定义返回位置' },

            { name: 'return_group', label: '返回到组合', type: 'number', default: 0, condition: { field: 'return_mode', value: 'custom' } },

            { name: 'return_step', label: '返回到步骤(从1开始)', type: 'number', default: 1, min: 1, condition: { field: 'return_mode', value: 'custom' } }

        ]

    },

    multi_hold: {

        name: '同时按住',

        icon: '🤏',

        category: 'control',

        fields: [

            { name: 'keys', label: '按键列表', type: 'multi_key', default: [] }

        ]

    },

    repeat_start: {

        name: '重复(头)',

        icon: '🔁',

        category: 'control',

        fields: [

            { name: 'count', label: '重复次数', type: 'number', default: 1, min: 1, hint: '将此操作与"重复(尾)"之间的所有步骤重复执行指定次数' }

        ]

    },

    repeat_end: {

        name: '重复(尾)',

        icon: '🔚',

        category: 'control',

        fields: []

    },

    

    // 窗口操作

    resize_window: {

        name: '调整窗口大小',

        icon: '📐',

        category: 'window',

        fields: [

            { name: 'find_by', label: '查找方式', type: 'select', options: ['process_name', 'window_title', 'pid'], default: 'process_name' },

            { name: 'target', label: '目标', type: 'text', default: '', hint: '程序名/窗口标题/PID' },

            { name: 'width', label: '宽度', type: 'number', default: 1280 },

            { name: 'height', label: '高度', type: 'number', default: 720 },

            { name: 'preset_size', label: '预设分辨率', type: 'select', options: ['自定义', '1920x1080', '1280x720', '1024x768', '800x600', '640x480'], default: '自定义' }

        ]

    },

    move_window: {

        name: '移动窗口位置',

        icon: '🪟',

        category: 'window',

        fields: [

            { name: 'find_by', label: '查找方式', type: 'select', options: ['process_name', 'window_title', 'pid'], default: 'process_name' },

            { name: 'target', label: '目标', type: 'text', default: '', hint: '程序名/窗口标题/PID' },

            { name: 'x', label: 'X坐标', type: 'number', default: 0 },

            { name: 'y', label: 'Y坐标', type: 'number', default: 0 },

            { name: 'preset_pos', label: '预设位置', type: 'select', options: ['自定义', '左上角', '右上角', '左下角', '右下角', '居中'], default: '自定义' }

        ]

    },

    activate_window: {

        name: '切换至窗口',

        icon: '🔲',

        category: 'window',

        fields: [

            { name: 'find_by', label: '查找方式', type: 'select', options: ['process_name', 'window_title', 'pid'], default: 'process_name' },

            { name: 'target', label: '目标', type: 'text', default: '', hint: '程序名/窗口标题/PID' }

        ]

    },

    close_window: {

        name: '强制关闭程序',

        icon: '❌',

        category: 'window',

        fields: [

            { name: 'find_by', label: '查找方式', type: 'select', options: ['process_name', 'window_title', 'pid'], default: 'process_name' },

            { name: 'target', label: '目标', type: 'text', default: '', hint: '程序名/窗口标题/PID' }

        ]

    },

    set_windowed: {

        name: '调整为窗口模式',

        icon: '🖼️',

        category: 'window',

        fields: [

            { name: 'find_by', label: '查找方式', type: 'select', options: ['process_name', 'window_title', 'pid'], default: 'process_name' },

            { name: 'target', label: '目标', type: 'text', default: '', hint: '程序名/窗口标题/PID' },

            { name: 'width', label: '窗口宽度', type: 'number', default: 1280 },

            { name: 'height', label: '窗口高度', type: 'number', default: 720 },

            { name: 'preset_size', label: '预设分辨率', type: 'select', options: ['自定义', '1920x1080', '1280x720', '1024x768', '800x600'], default: '自定义' }

        ]

    },

    window_exists: {

        name: '检测窗口',

        icon: '🔎',

        category: 'window',

        fields: [

            { name: 'find_by', label: '查找方式', type: 'select', options: ['process_name', 'window_title', 'pid'], default: 'process_name' },

            { name: 'target', label: '目标', type: 'text', default: '', hint: '程序名/窗口标题/PID' }

        ]

    },

    // 截图操作
    screenshot: {
        name: '截图保存',
        icon: '📷',
        category: 'image',
        fields: []
    }

};



// 图片识别类型（支持成功/失败跳转）

const IMAGE_STEP_TYPES = ['image_find', 'image_click', 'image_click_ocr', 'wait_image', 'wait_image_disappear', 'continuous_click'];



// 窗口检测类型（支持存在/不存在跳转）

const WINDOW_CHECK_TYPES = ['window_exists'];



// 工作流数据

let workflow = {

    name: '新建流程',

    description: '',

    default_group: 0,  // 默认启动组合索引

    groups: [

        {

            name: '组合 1',

            steps: [],

            loop_mode: 'once',

            loop_count: 1,

            loop_duration: 0,

            humanize: {

                enabled: true,

                position_range: 3,

                delay_min: 20,

                delay_max: 150

            }

        }

    ],

    editable_config: {

        enabled: false,

        items: []  // {group_index, step_index, mode: 'single'|'batch', label}

    }

};



// 当前选中的组合索引

let currentGroupIndex = 0;



// 当前选中的步骤索引

let selectedStepIndex = -1;



// 多选状态：存储所有选中的步骤索引

let selectedStepIndices = new Set();



// 剪贴板：存储复制的步骤数据

let clipboardSteps = [];



// 保存canvas滚动位置

let canvasScrollTop = 0;

let isUpdatingCanvas = false;  // 标记是否正在更新canvas

let isShowingDialog = false;   // 标记是否正在显示对话框



// 当前编辑的文件名

let currentFilename = null;

// 受限编辑模式（仅允许修改editable_config中的步骤）
let isEditableMode = false;
let editableConfig = null;
let editableStepKeys = new Set(); // 格式: "groupIndex_stepIndex"

// 初始化

document.addEventListener('DOMContentLoaded', function() {

    // 检查是否是受限编辑模式
    const urlParams = new URLSearchParams(window.location.search);
    isEditableMode = urlParams.get('editable') === 'true';
    
    if (isEditableMode) {
        initEditableMode();
    } else {
        initDragAndDrop();
    }

    initToolbar();

    initGroupSettings();

    updateHumanizeSettings();

    updateGroupTabs();

    updateGroupSettings();

    updateDefaultButton();

    updateCanvas();

    

    // 监听canvas滚动事件，持续跟踪滚动位置

    const canvas = document.getElementById('canvas');

    canvas.addEventListener('scroll', function() {

        // 只有在非更新期间且非对话框显示期间才记录滚动位置

        if (!isUpdatingCanvas && !isShowingDialog) {

            canvasScrollTop = canvas.scrollTop;

        }

    });

    

    // 检查URL参数，自动打开配置文件

    const openFile = urlParams.get('open');

    if (openFile) {

        openWorkflow(openFile);

    }
    
    // 受限模式下加载可编辑配置
    if (isEditableMode) {
        loadEditableConfig();
    }

});

// 初始化受限编辑模式
function initEditableMode() {
    // 隐藏左侧操作卡片面板
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';
    
    // 隐藏工具栏中的添加/删除按钮
    const btnNew = document.getElementById('btn-new');
    const btnClear = document.getElementById('btn-clear');
    const btnAddGroup = document.getElementById('btn-add-group');
    if (btnNew) btnNew.style.display = 'none';
    if (btnClear) btnClear.style.display = 'none';
    if (btnAddGroup) btnAddGroup.style.display = 'none';
    
    // 隐藏组合标签栏和组合设置
    const groupsTabs = document.querySelector('.groups-tabs');
    const groupSettings = document.getElementById('group-settings');
    if (groupsTabs) groupsTabs.style.display = 'none';
    if (groupSettings) groupSettings.style.display = 'none';
    
    // 隐藏搜索框
    const searchBox = document.querySelector('.search-box');
    if (searchBox) searchBox.style.display = 'none';
    
    // 隐藏全部不可改按钮（通过查找包含🔒的按钮）
    document.querySelectorAll('.toolbar-right .btn').forEach(btn => {
        if (btn.textContent.includes('不可改')) {
            btn.style.display = 'none';
        }
    });
    
    // 隐藏流程名称输入框，改为只显示文本
    const workflowNameInput = document.getElementById('workflow-name');
    if (workflowNameInput) {
        workflowNameInput.style.display = 'none';
    }
    
    // 修改标题
    document.title = '自定义配置编辑器';
    
    // 加载可编辑配置数据
    loadEditableConfig();
}

// 加载可编辑配置信息
async function loadEditableConfig() {
    try {
        const resp = await fetch('/api/editable_config');
        const data = await resp.json();
        editableConfig = data;
        
        // 构建可编辑步骤的键集合
        editableStepKeys.clear();
        if (data.items) {
            data.items.forEach(item => {
                const key = `${item.group_index}_${item.step_index}`;
                editableStepKeys.add(key);
            });
        }
        
        // 使用editable_groups构建受限的workflow结构
        if (data.editable_groups && data.editable_groups.length > 0) {
            // 构建只包含可编辑步骤的workflow
            // 注意：groups数组可能是稀疏的，需要正确处理
            const groups = [];
            data.editable_groups.forEach(eg => {
                const groupData = eg.data;
                const stepsDict = groupData.steps || {};
                // 将步骤字典转换为数组（只包含可编辑的步骤）
                const stepsArray = [];
                Object.keys(stepsDict).forEach(idx => {
                    const stepIdx = parseInt(idx);
                    stepsArray[stepIdx] = stepsDict[idx];
                });
                groups[eg.index] = {
                    name: groupData.name,
                    steps: stepsArray
                };
            });
            
            // 确保editableConfig使用服务器返回的items
            editableConfig = { items: data.items || [] };
            
            workflow = {
                name: data.name || '配置',
                groups: groups,
                editable_config: { enabled: true, items: data.items }
            };
            currentGroupIndex = data.editable_groups[0]?.index || 0;
            
            // 在工具栏中央显示配置名称和可改项数量
            const toolbarCenter = document.querySelector('.toolbar-center');
            if (toolbarCenter) {
                const itemCount = data.items ? data.items.length : 0;
                toolbarCenter.innerHTML = `<span style="font-size:16px;font-weight:bold;color:#667eea;">${data.name || '配置'}</span>
                    <span style="margin-left:15px;color:#a0a0a0;">📝 ${itemCount} 个可改项</span>`;
            }
            
            updateCanvas();
        }
    } catch (e) {
        console.error('加载可编辑配置失败:', e);
    }
}

// 检查步骤是否可编辑
function isStepEditable(groupIndex, stepIndex) {
    if (!isEditableMode) return true;
    const key = `${groupIndex}_${stepIndex}`;
    return editableStepKeys.has(key);
}

// 受限模式下保存配置
async function saveEditableConfig() {
    try {
        // 构建更新数据
        const updates = [];
        if (editableConfig && editableConfig.items) {
            editableConfig.items.forEach(item => {
                const groupIdx = item.group_index;
                const stepIdx = item.step_index;
                if (groupIdx < workflow.groups.length) {
                    const steps = workflow.groups[groupIdx].steps || [];
                    if (stepIdx < steps.length) {
                        updates.push({
                            group_index: groupIdx,
                            step_index: stepIdx,
                            values: steps[stepIdx]
                        });
                    }
                }
            });
        }
        
        const resp = await fetch('/api/editable_config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({updates: updates})  // 只传递updates，不传递整个workflow
        });
        const result = await resp.json();
        if (result.success) {
            showMsg('配置已保存！', 'success');
        } else {
            showMsg('保存失败: ' + (result.error || '未知错误'), 'error');
        }
    } catch (e) {
        showMsg('保存失败: ' + e.message, 'error');
    }
}

// 受限模式下渲染可编辑步骤
function renderEditableSteps(canvas) {
    if (!editableConfig || !editableConfig.items) return;
    
    const groups = workflow.groups || [];
    
    // 按batch_id分组，合并批量可改的步骤
    const batchGroups = {};  // batch_id -> items[]
    const singleItems = [];  // 单独可改的步骤
    
    editableConfig.items.forEach(item => {
        if (item.mode === 'batch' && item.batch_id) {
            if (!batchGroups[item.batch_id]) {
                batchGroups[item.batch_id] = [];
            }
            batchGroups[item.batch_id].push(item);
        } else {
            // 默认当作单独可改项处理（包括mode为single、未设置mode、或batch_main的情况）
            singleItems.push(item);
        }
    });
    
    // 渲染批量可改卡片（合并为一个）
    Object.keys(batchGroups).forEach(batchId => {
        const batchItems = batchGroups[batchId];
        const mainItem = batchItems.find(i => i.batch_main) || batchItems[0];
        if (!mainItem) return;
        
        const groupIdx = mainItem.group_index;
        const stepIdx = mainItem.step_index;
        if (groupIdx >= groups.length || !groups[groupIdx]) return;
        const steps = groups[groupIdx].steps || [];
        
        const step = steps[stepIdx];
        if (!step) return;  // 稀疏数组检查
        const typeConfig = STEP_TYPES[step.type];
        if (!typeConfig) return;
        
        const card = document.createElement('div');
        card.className = 'step-card editable-batch';
        card.dataset.batchId = batchId;
        card.dataset.groupIndex = groupIdx;
        card.dataset.stepIndex = stepIdx;
        
        card.innerHTML = `
            <div class="step-number">🔄</div>
            <div class="step-icon">${typeConfig.icon}</div>
            <div class="step-info">
                <div class="step-name">${mainItem.label || step.name || typeConfig.name}</div>
                <div class="step-desc">${getStepDescription(step)}</div>
                <div class="batch-count" style="color:#2196F3;font-size:12px;margin-top:4px;">📦 批量修改 ${batchItems.length} 个操作</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            // 选中批量的主步骤
            currentGroupIndex = groupIdx;
            selectedStepIndex = stepIdx;
            selectedStepIndices.clear();
            selectedStepIndices.add(stepIdx);
            updatePropertiesPanel();
            // 高亮当前卡片
            canvas.querySelectorAll('.step-card').forEach(c => c.classList.remove('selected', 'primary-selected'));
            card.classList.add('selected', 'primary-selected');
        });
        
        canvas.appendChild(card);
    });
    
    // 渲染单独可改卡片
    singleItems.forEach(item => {
        const groupIdx = item.group_index;
        const stepIdx = item.step_index;
        if (groupIdx >= groups.length || !groups[groupIdx]) return;
        const steps = groups[groupIdx].steps || [];
        
        const step = steps[stepIdx];
        if (!step) return;  // 稀疏数组检查
        const typeConfig = STEP_TYPES[step.type];
        if (!typeConfig) return;
        
        const card = document.createElement('div');
        card.className = 'step-card editable-single';
        card.dataset.groupIndex = groupIdx;
        card.dataset.stepIndex = stepIdx;
        
        card.innerHTML = `
            <div class="step-number">${stepIdx + 1}</div>
            <div class="step-icon">${typeConfig.icon}</div>
            <div class="step-info">
                <div class="step-name">${item.label || step.name || typeConfig.name}</div>
                <div class="step-desc">${getStepDescription(step)}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            currentGroupIndex = groupIdx;
            selectedStepIndex = stepIdx;
            selectedStepIndices.clear();
            selectedStepIndices.add(stepIdx);
            updatePropertiesPanel();
            canvas.querySelectorAll('.step-card').forEach(c => c.classList.remove('selected', 'primary-selected'));
            card.classList.add('selected', 'primary-selected');
        });
        
        canvas.appendChild(card);
    });
    
    // 如果没有可编辑项
    if (Object.keys(batchGroups).length === 0 && singleItems.length === 0) {
        const placeholder = document.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
            placeholder.innerHTML = '<p>📭 没有可编辑的配置项</p>';
        }
    }
}

// 获取当前组合

function getCurrentGroup() {

    return workflow.groups[currentGroupIndex] || workflow.groups[0];

}



// 获取当前组合的步骤

function getCurrentSteps() {

    return getCurrentGroup().steps || [];

}



// 初始化拖拽功能

function initDragAndDrop() {

    // 操作卡片拖拽

    const actionCards = document.querySelectorAll('.action-card');

    actionCards.forEach(card => {

        card.addEventListener('dragstart', handleDragStart);

        card.addEventListener('dragend', handleDragEnd);

    });

    

    // 画布放置区域

    const canvas = document.getElementById('canvas');

    canvas.addEventListener('dragover', handleDragOver);

    canvas.addEventListener('dragleave', handleDragLeave);

    canvas.addEventListener('drop', handleDrop);

}



function handleDragStart(e) {

    e.target.classList.add('dragging');

    e.dataTransfer.setData('text/plain', e.target.dataset.type);

    e.dataTransfer.setData('source', 'sidebar');

    e.dataTransfer.effectAllowed = 'copy';

    window._sidebarDrag = true;

}



function handleDragEnd(e) {

    e.target.classList.remove('dragging');

    window._sidebarDrag = false;

    // 清除所有插入指示器

    document.querySelectorAll('.insert-indicator').forEach(el => el.remove());

    document.querySelectorAll('.step-card').forEach(c => {

        c.classList.remove('drag-over-above', 'drag-over-below');

    });

}



function handleDragOver(e) {

    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy';

    

    if (!window._sidebarDrag) return;

    

    const canvas = document.getElementById('canvas');

    canvas.classList.add('drag-over');

    

    // 查找插入位置

    const cards = Array.from(canvas.querySelectorAll('.step-card'));

    

    // 清除之前的指示

    cards.forEach(c => c.classList.remove('drag-over-above', 'drag-over-below'));

    

    if (cards.length === 0) return;

    

    // 找到最近的卡片

    for (let i = 0; i < cards.length; i++) {

        const card = cards[i];

        const rect = card.getBoundingClientRect();

        const midY = rect.top + rect.height / 2;

        

        if (e.clientY < midY) {

            card.classList.add('drag-over-above');

            window._insertIndex = i;

            return;

        }

    }

    

    // 如果在所有卡片下方，插入到末尾

    cards[cards.length - 1].classList.add('drag-over-below');

    window._insertIndex = cards.length;

}



function handleDragLeave(e) {

    // 检查是否真正离开了画布

    const canvas = document.getElementById('canvas');

    const rect = canvas.getBoundingClientRect();

    if (e.clientX < rect.left || e.clientX > rect.right || 

        e.clientY < rect.top || e.clientY > rect.bottom) {

        canvas.classList.remove('drag-over');

        document.querySelectorAll('.step-card').forEach(c => {

            c.classList.remove('drag-over-above', 'drag-over-below');

        });

        window._insertIndex = -1;

    }

}



function handleDrop(e) {

    e.preventDefault();

    const canvas = document.getElementById('canvas');

    canvas.classList.remove('drag-over');

    

    // 清除指示

    document.querySelectorAll('.step-card').forEach(c => {

        c.classList.remove('drag-over-above', 'drag-over-below');

    });

    

    const stepType = e.dataTransfer.getData('text/plain');

    const source = e.dataTransfer.getData('source');

    

    if (source === 'sidebar' && stepType && STEP_TYPES[stepType]) {

        const insertIndex = window._insertIndex;

        if (insertIndex >= 0 && insertIndex < getCurrentSteps().length) {

            addStepAt(stepType, insertIndex);

        } else {

            addStep(stepType);

        }

    }

    

    window._sidebarDrag = false;

    window._insertIndex = -1;

}



// 添加步骤到末尾

function addStep(type) {

    addStepAt(type, -1);

}



// 添加步骤到指定位置

function addStepAt(type, index) {

    const typeConfig = STEP_TYPES[type];

    if (!typeConfig) return;

    

    const step = {

        type: type,

        name: typeConfig.name

    };

    

    // 设置默认值

    typeConfig.fields.forEach(field => {

        if (field.default !== null && field.default !== undefined) {

            if (field.name === 'keys' && typeof field.default === 'string') {

                // 特殊处理组合键（字符串格式）

                step[field.name] = field.default.split(',').filter(k => k);

            } else if (field.type === 'multi_key' || field.type === 'region_list') {

                // 多按键编辑器和区域列表使用数组 - 需要深拷贝

                step[field.name] = Array.isArray(field.default) ? JSON.parse(JSON.stringify(field.default)) : [];

            } else if (Array.isArray(field.default)) {

                // 其他数组类型也需要深拷贝

                step[field.name] = JSON.parse(JSON.stringify(field.default));

            } else if (typeof field.default === 'object' && field.default !== null) {

                // 对象类型深拷贝

                step[field.name] = JSON.parse(JSON.stringify(field.default));

            } else {

                // 基本类型直接赋值

                step[field.name] = field.default;

            }

        }

    });

    

    const steps = getCurrentGroup().steps;

    if (index >= 0 && index < steps.length) {

        // 在指定位置插入

        steps.splice(index, 0, step);

        updateCanvas();

        selectStep(index);

    } else {

        // 添加到末尾

        steps.push(step);

        updateCanvas();

        selectStep(steps.length - 1);

    }

}



// 更新画布

function updateCanvas() {

    const canvas = document.getElementById('canvas');

    const placeholder = canvas.querySelector('.canvas-placeholder');

    const steps = getCurrentSteps();

    

    // 标记正在更新，避免scroll事件错误记录位置

    isUpdatingCanvas = true;

    

    // 使用全局变量保存的滚动位置（避免对话框影响）

    const scrollTop = canvasScrollTop;

    

    if (steps.length === 0) {

        placeholder.style.display = 'block';

        // 移除所有步骤卡片

        const stepCards = canvas.querySelectorAll('.step-card');

        stepCards.forEach(card => card.remove());

        isUpdatingCanvas = false;

        return;

    }

    

    placeholder.style.display = 'none';

    

    // 清除现有步骤卡片

    const existingCards = canvas.querySelectorAll('.step-card');

    existingCards.forEach(card => card.remove());

    
    // 受限模式：只显示可编辑的步骤，批量合并
    if (isEditableMode && editableConfig && editableConfig.items) {
        renderEditableSteps(canvas);
        isUpdatingCanvas = false;
        requestAnimationFrame(() => { canvas.scrollTop = scrollTop; });
        return;
    }

    // 渲染步骤

    steps.forEach((step, index) => {

        const typeConfig = STEP_TYPES[step.type];

        if (!typeConfig) return;

        

        const card = document.createElement('div');

        // 支持多选高亮显示

        const isSelected = selectedStepIndices.has(index);

        const isPrimarySelected = index === selectedStepIndex;

        // 获取可改状态

        const editableMode = getEditableMode(currentGroupIndex, index);

        const editableClass = editableMode === 'single' ? ' editable-single' : 

                              editableMode === 'batch' ? ' editable-batch' : '';

        card.className = 'step-card' + (isSelected ? ' selected' : '') + (isPrimarySelected ? ' primary-selected' : '') + editableClass;

        card.dataset.index = index;

        

        // 获取可改按钮状态

        const editableBtnClass = editableMode === 'single' ? 'editable-single' : 

                                 editableMode === 'batch' ? 'editable-batch' : '';

        const editableBtnTitle = editableMode === 'single' ? '单独可改 (点击切换)' : 

                                 editableMode === 'batch' ? '批量可改 (点击切换)' : '不可改 (点击设为可改)';

        const editableBtnIcon = editableMode === 'single' ? '✏️' : 

                                editableMode === 'batch' ? '🔄' : '🔒';

        

        // 受限模式下检查是否可编辑
        const canEdit = isStepEditable(currentGroupIndex, index);
        const disabledClass = (isEditableMode && !canEdit) ? ' disabled-step' : '';
        card.className += disabledClass;
        
        // 受限模式下的按钮显示
        let actionsHtml = '';
        if (isEditableMode) {
            // 受限模式：不显示删除和移动按钮，不显示可改切换按钮
            actionsHtml = canEdit ? '' : '<span style="color:#666;font-size:12px;">🔒</span>';
        } else {
            // 正常模式：显示所有按钮
            actionsHtml = `
                <button class="step-btn editable-btn ${editableBtnClass}" onclick="event.stopPropagation(); toggleEditable(${index})" title="${editableBtnTitle}">${editableBtnIcon}</button>
                <button class="step-btn move-up" onclick="moveStep(${index}, -1)" title="上移">↑</button>
                <button class="step-btn move-down" onclick="moveStep(${index}, 1)" title="下移">↓</button>
                <button class="step-btn delete" onclick="deleteStep(${index})" title="删除">×</button>
            `;
        }
        
        card.innerHTML = `

            <div class="step-number">${index + 1}</div>

            <div class="step-icon">${typeConfig.icon}</div>

            <div class="step-info">

                <div class="step-name">${step.name || typeConfig.name}</div>

                <div class="step-desc">${getStepDescription(step)}</div>

            </div>

            <div class="step-actions">
                ${actionsHtml}
            </div>

        `;

        

        card.addEventListener('click', (e) => {

            if (!e.target.closest('.step-actions')) {

                selectStep(index, e);

            }

        });

        

        // 右键菜单

        card.addEventListener('contextmenu', (e) => {

            e.preventDefault();

            // 如果右键点击的卡片不在选中集合中，先选中它

            if (!selectedStepIndices.has(index)) {

                selectStep(index, e);

            }

            showContextMenu(e.clientX, e.clientY);

        });

        

        // 自定义拖拽排序（鼠标跟随效果）

        card.addEventListener('mousedown', (e) => {

            if (e.target.closest('.step-actions')) return;

            if (e.button !== 0) return; // 只响应左键

            

            e.preventDefault();

            initDrag(card, index, e);

        });

        

        canvas.appendChild(card);

    });

    

    // 恢复滚动位置（使用 requestAnimationFrame 确保 DOM 更新后执行）

    requestAnimationFrame(() => {

        canvas.scrollTop = scrollTop;

        isUpdatingCanvas = false;

    });

}



// 获取步骤描述

function getStepDescription(step) {

    switch (step.type) {

        case 'click':

            return `${step.button || 'left'}键 ${step.clicks || 1}次 (当前位置)`;

        case 'double_click':

            return `双击 (当前位置)`;

        case 'right_click':

            return `右键 (当前位置)`;

        case 'move':

            return `移动到: (${step.x || 0}, ${step.y || 0})`;

        case 'drag':

            return `(${step.start_x || 0}, ${step.start_y || 0}) → (${step.end_x || 0}, ${step.end_y || 0})`;

        case 'scroll':

            return `滚动: ${step.clicks || 0} 格`;

        case 'type':

            return `文本: ${(step.text || '').substring(0, 30)}${(step.text || '').length > 30 ? '...' : ''}`;

        case 'press':

            return `按键: ${step.key || ''}`;

        case 'hotkey':

            return `组合键: ${Array.isArray(step.keys) ? step.keys.join('+') : step.keys || ''}`;

        case 'image_find':

            let findDesc = `识别: ${step.image || '未设置'} → 移动鼠标`;

            findDesc += getImageActionSuffix(step);

            return findDesc;

        case 'image_click':

        case 'wait_image':

        case 'wait_image_disappear':

            let desc = `图片: ${step.image || '未设置'}`;

            desc += getImageActionSuffix(step);

            return desc;

        case 'image_click_ocr':

            let ocrDesc = `OCR: ${step.image || '未设置'} [${step.ocr_text || '无文字'}]`;

            ocrDesc += getImageActionSuffix(step);

            return ocrDesc;

        case 'continuous_click':

            const actionType = step.action_type || 'click';

            const actionText = actionType === 'key' 

                ? `按键(${step.key || '未设置'})`

                : `点击(${step.button || 'left'})`;

            return `常驻: ${step.image || '未设置'} - ${actionText} (${step.interval || 1}秒)`;

        case 'change_detection':

            const regionCount = Array.isArray(step.regions) ? step.regions.length : 0;

            return `监控 ${regionCount} 个区域 (超时${step.timeout || 10}秒)`;

        case 'color_check':

            const targetColor = step.target_color || [255, 255, 255];

            return `检测(${step.x || 0},${step.y || 0}) RGB(${targetColor[0]},${targetColor[1]},${targetColor[2]}) 容差${step.tolerance || 30}`;

        case 'pixel_position':
            return `目标(${step.target_x || 0}, ${step.target_y || 0}) 误差±${step.tolerance || 5}px`;

        case 'delay':

            return `延迟: ${step.ms || 0}ms`;

        case 'log':

            return `日志: ${(step.message || '').substring(0, 30)}`;

        case 'jump_group':

            return `跳转到组合 ${(step.target_group || 0) + 1}`;

        case 'multi_hold':

            const keyCount = Array.isArray(step.keys) ? step.keys.length : 0;

            return `同时按住: ${keyCount}个按键`;

        case 'resize_window':

        case 'move_window':

        case 'activate_window':

        case 'close_window':

        case 'set_windowed':

        case 'window_exists':

            const findByLabels = { process_name: '进程', window_title: '标题', pid: 'PID' };

            const findBy = step.find_by || 'process_name';

            const target = step.target || step.process_name || step.window_title || '未设置';

            let winDesc = `[${findByLabels[findBy] || findBy}] ${target}`;

            if (step.type === 'window_exists') {

                winDesc += getWindowCheckSuffix(step);

            }

            return winDesc;

        default:

            return '';

    }

}



// 获取图片识别步骤的后缀描述

function getImageActionSuffix(step) {

    let suffix = '';

    const onFail = step.on_fail || 'continue';

    const onSuccess = step.on_success || 'continue';

    

    if (onFail === 'jump' && step.fail_jump_group >= 0) {

        suffix += ` 失败→组合${step.fail_jump_group + 1}`;

    } else if (onFail === 'stop') {

        suffix += ' 失败→停止';

    }

    

    if (onSuccess === 'jump' && step.success_jump_group >= 0) {

        suffix += ` 成功→组合${step.success_jump_group + 1}`;

    } else if (onSuccess === 'stop') {

        suffix += ' 成功→停止';

    }

    

    return suffix;

}



// 获取窗口检测步骤的后缀描述

function getWindowCheckSuffix(step) {

    let suffix = '';

    const onExists = step.on_exists || 'continue';

    const onNotExists = step.on_not_exists || 'continue';

    

    if (onExists === 'jump' && step.exists_jump_group >= 0) {

        suffix += ` 存在→组合${step.exists_jump_group + 1}`;

    } else if (onExists === 'stop') {

        suffix += ' 存在→停止';

    }

    

    if (onNotExists === 'jump' && step.not_exists_jump_group >= 0) {

        suffix += ` 不存在→组合${step.not_exists_jump_group + 1}`;

    } else if (onNotExists === 'stop') {

        suffix += ' 不存在→停止';

    }

    

    return suffix;

}



// 选择步骤

function selectStep(index, event) {

    // 受限模式下，不可编辑的步骤不能选择
    if (isEditableMode && !isStepEditable(currentGroupIndex, index)) {
        showMsg('此步骤不可编辑', 'warning');
        return;
    }

    const steps = getCurrentSteps();

    

    if (event && event.ctrlKey) {

        // Ctrl+Click: 切换选中状态

        if (selectedStepIndices.has(index)) {

            selectedStepIndices.delete(index);

            if (selectedStepIndex === index) {

                // 如果取消的是当前主选中项，选择集合中的第一个

                selectedStepIndex = selectedStepIndices.size > 0 ? Math.min(...selectedStepIndices) : -1;

            }

        } else {

            selectedStepIndices.add(index);

            selectedStepIndex = index;

        }

    } else if (event && event.shiftKey && selectedStepIndex >= 0) {

        // Shift+Click: 范围选择

        const start = Math.min(selectedStepIndex, index);

        const end = Math.max(selectedStepIndex, index);

        for (let i = start; i <= end; i++) {

            selectedStepIndices.add(i);

        }

    } else {

        // 普通点击：单选

        selectedStepIndices.clear();

        selectedStepIndices.add(index);

        selectedStepIndex = index;

    }

    

    updateCanvas();

    updatePropertiesPanel();

}



// 清除所有选择

function clearSelection() {

    selectedStepIndex = -1;

    selectedStepIndices.clear();

    updateCanvas();

    updatePropertiesPanel();

}



// 全选当前组合的所有步骤

function selectAllSteps() {

    const steps = getCurrentSteps();

    selectedStepIndices.clear();

    for (let i = 0; i < steps.length; i++) {

        selectedStepIndices.add(i);

    }

    if (steps.length > 0) {

        selectedStepIndex = 0;

    }

    updateCanvas();

    updatePropertiesPanel();

}



// 更新属性面板

function updatePropertiesPanel() {

    const panel = document.getElementById('properties-content');

    const steps = getCurrentSteps();

    

    if (selectedStepIndex < 0 || selectedStepIndex >= steps.length) {

        panel.innerHTML = '<p class="empty-hint">选择一个步骤来编辑属性</p>';

        return;

    }

    

    // 多选时显示提示

    let multiSelectHint = '';

    if (selectedStepIndices.size > 1) {

        multiSelectHint = `

            <div class="selection-hint">

                📋 已选中 ${selectedStepIndices.size} 个步骤<br>

                <small>Ctrl+C 复制 | Ctrl+V 粘贴 | Delete 删除</small>

            </div>

        `;

    }

    

    const step = steps[selectedStepIndex];

    const typeConfig = STEP_TYPES[step.type];

    

    if (!typeConfig) {

        panel.innerHTML = '<p class="empty-hint">未知步骤类型</p>';

        return;

    }

    

    let html = `

        <div class="form-group">

            <label>步骤名称</label>

            <input type="text" id="prop-name" value="${step.name || typeConfig.name}" 

                   onchange="updateStepProperty('name', this.value)">

        </div>

        <div class="form-group">

            <label>执行前延迟(ms)</label>

            <input type="number" id="prop-delay" value="${step.delay || 0}" min="0"

                   onchange="updateStepProperty('delay', parseInt(this.value) || 0)">

        </div>

    `;

    

    // 检查是否有XY坐标字段（移动鼠标）

    const hasXY = typeConfig.fields.some(f => f.name === 'x') && typeConfig.fields.some(f => f.name === 'y');

    // 检查是否是拖拽（有起点和终点）

    const isDrag = step.type === 'drag';

    

    if (hasXY) {

        html += `

            <div class="form-group">

                <button type="button" class="btn btn-primary btn-full" onclick="captureMousePosition()">

                    🎯 获取鼠标坐标

                </button>

                ${renderCoordModeSelector()}

                <div class="form-hint" id="capture-status">点击后按设定方式获取坐标</div>

            </div>

        `;

    }

    

    if (isDrag) {

        html += `

            <div class="form-group">

                <div style="display: flex; gap: 8px;">

                    <button type="button" class="btn btn-primary" style="flex:1" onclick="captureDragStart()">

                        🎯 获取起点

                    </button>

                    <button type="button" class="btn btn-success" style="flex:1" onclick="captureDragEnd()">

                        🎯 获取终点

                    </button>

                </div>

                ${renderCoordModeSelector()}

                <div class="form-hint" id="capture-drag-status">点击后按设定方式获取坐标</div>

            </div>

        `;

    }

    

    // 渲染字段

    typeConfig.fields.forEach(field => {

        const value = step[field.name];

        

        // 条件显示检查

        if (field.condition) {

            const condField = field.condition.field;

            const condValue = step[condField];

            // 支持 value 和 notValue 两种条件

            if (field.condition.value !== undefined && condValue !== field.condition.value) {

                return; // 条件不满足，跳过此字段

            }

            if (field.condition.notValue !== undefined && condValue === field.condition.notValue) {

                return; // 条件不满足，跳过此字段

            }

        }

        

        // 跳转组合的目标组合字段特殊处理

        if (field.name === 'target_group') {

            html += `

                <div class="form-group">

                    <label>${field.label || '目标组合'}</label>

                    <select id="prop-target_group" onchange="updateStepProperty('target_group', parseInt(this.value))">

                        ${workflow.groups.map((g, i) => 

                            `<option value="${i}" ${value === i ? 'selected' : ''}>组合 ${i + 1}: ${g.name}</option>`

                        ).join('')}

                    </select>

                    <div class="form-hint">选择要跳转到的目标组合</div>

                </div>

            `;

            return;

        }

        

        // 返回组合字段特殊处理（调用组合功能）

        if (field.name === 'return_group') {

            html += `

                <div class="form-group">

                    <label>${field.label || '返回到组合'}</label>

                    <select id="prop-return_group" onchange="updateStepProperty('return_group', parseInt(this.value))">

                        ${workflow.groups.map((g, i) => 

                            `<option value="${i}" ${value === i ? 'selected' : ''}>组合 ${i + 1}: ${g.name}</option>`

                        ).join('')}

                    </select>

                </div>

            `;

            return;

        }

        

        // 常驻任务条件显示：根据 action_type 决定显示哪些字段

        if (step.type === 'continuous_click') {

            const actionType = step.action_type || 'click';

            // 如果是 button 字段，仅在 action_type=click 时显示

            if (field.name === 'button' && actionType !== 'click') {

                return;

            }

            // 如果是 key 字段，仅在 action_type=key 时显示

            if (field.name === 'key' && actionType !== 'key') {

                return;

            }

        }

        

        html += renderField(field, value, step);

    });

    

    // 图片识别类型的失败/成功处理

    if (IMAGE_STEP_TYPES.includes(step.type)) {

        // 失败时

        html += `

            <div class="form-group">

                <label>失败时</label>

                <select id="prop-on_fail" onchange="onImageFailChange(this.value)">

                    <option value="continue" ${step.on_fail === 'continue' ? 'selected' : ''}>继续执行后续</option>

                    <option value="stop" ${step.on_fail === 'stop' ? 'selected' : ''}>停止当前组合</option>

                    <option value="retry" ${step.on_fail === 'retry' ? 'selected' : ''}>重试</option>

                    <option value="jump" ${step.on_fail === 'jump' ? 'selected' : ''}>跳转组合</option>

                </select>

            </div>

        `;

        

        // 失败时跳转组合选择（当选择跳转组合时显示）

        html += `

            <div class="form-group" id="fail-jump-group" style="display: ${step.on_fail === 'jump' ? 'block' : 'none'};">

                <label>跳转到</label>

                <select id="prop-fail_jump_group" onchange="updateStepProperty('fail_jump_group', parseInt(this.value))">

                    ${workflow.groups.map((g, i) => 

                        `<option value="${i}" ${step.fail_jump_group === i ? 'selected' : ''}>组合 ${i + 1}: ${g.name}</option>`

                    ).join('')}

                </select>

            </div>

        `;

        

        // 成功时

        html += `

            <div class="form-group">

                <label>成功时</label>

                <select id="prop-on_success" onchange="onImageSuccessChange(this.value)">

                    <option value="continue" ${!step.on_success || step.on_success === 'continue' ? 'selected' : ''}>继续执行后续</option>

                    <option value="stop" ${step.on_success === 'stop' ? 'selected' : ''}>停止当前组合</option>

                    <option value="jump" ${step.on_success === 'jump' ? 'selected' : ''}>跳转组合</option>

                </select>

            </div>

        `;

        

        // 成功时跳转组合选择

        html += `

            <div class="form-group" id="success-jump-group" style="display: ${step.on_success === 'jump' ? 'block' : 'none'};">

                <label>跳转到</label>

                <select id="prop-success_jump_group" onchange="updateStepProperty('success_jump_group', parseInt(this.value))">

                    ${workflow.groups.map((g, i) => 

                        `<option value="${i}" ${step.success_jump_group === i ? 'selected' : ''}>组合 ${i + 1}: ${g.name}</option>`

                    ).join('')}

                </select>

            </div>

        `;

        // 区域限定功能（快捷粘贴 + 手动设置）
        const regionEnabled = step.region_enabled || false;
        const region = step.region || {};
        html += `
            <div class="form-group" style="margin-top: 12px; border-top: 1px solid var(--border-color, #383850); padding-top: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="prop-region_enabled" ${regionEnabled ? 'checked' : ''}
                           onchange="updateStepProperty('region_enabled', this.checked); updatePropertiesPanel();">
                    <span>区域限定（仅在指定区域内识别）</span>
                </label>
            </div>
            <div class="form-group" style="display: ${regionEnabled ? 'block' : 'none'};" id="region-settings">
                <label>快捷粘贴（截图信息）</label>
                <div style="display: flex; gap: 6px;">
                    <input type="text" id="region-paste-input" placeholder="粘贴: 文件名.png|x,y,w,h" 
                           style="flex:1;" onpaste="setTimeout(()=>parseRegionPaste(), 50)">
                    <button type="button" class="btn btn-sm" onclick="parseRegionPaste()" title="解析">📋 解析</button>
                </div>
                <div class="form-hint">支持格式: screenshot_xxx.png|550,951,288,148</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <div>
                        <label style="font-size: 12px;">X</label>
                        <input type="number" id="prop-region_x" value="${region.x || 0}" 
                               onchange="updateRegionField('x', parseInt(this.value) || 0)">
                    </div>
                    <div>
                        <label style="font-size: 12px;">Y</label>
                        <input type="number" id="prop-region_y" value="${region.y || 0}" 
                               onchange="updateRegionField('y', parseInt(this.value) || 0)">
                    </div>
                    <div>
                        <label style="font-size: 12px;">宽度</label>
                        <input type="number" id="prop-region_w" value="${region.width || 0}" 
                               onchange="updateRegionField('width', parseInt(this.value) || 0)">
                    </div>
                    <div>
                        <label style="font-size: 12px;">高度</label>
                        <input type="number" id="prop-region_h" value="${region.height || 0}" 
                               onchange="updateRegionField('height', parseInt(this.value) || 0)">
                    </div>
                </div>
            </div>
        `;

    } else if (WINDOW_CHECK_TYPES.includes(step.type)) {

        // 窗口检测类型 - 存在时/不存在时处理

        html += `

            <div class="form-group">

                <label>存在时</label>

                <select id="prop-on_exists" onchange="onWindowExistsChange(this.value)">

                    <option value="continue" ${!step.on_exists || step.on_exists === 'continue' ? 'selected' : ''}>继续执行后续</option>

                    <option value="stop" ${step.on_exists === 'stop' ? 'selected' : ''}>停止当前组合</option>

                    <option value="jump" ${step.on_exists === 'jump' ? 'selected' : ''}>跳转组合</option>

                </select>

            </div>

        `;

        

        // 存在时跳转组合选择

        html += `

            <div class="form-group" id="exists-jump-group" style="display: ${step.on_exists === 'jump' ? 'block' : 'none'};">

                <label>存在时跳转到</label>

                <select id="prop-exists_jump_group" onchange="updateStepProperty('exists_jump_group', parseInt(this.value))">

                    ${workflow.groups.map((g, i) => 

                        `<option value="${i}" ${step.exists_jump_group === i ? 'selected' : ''}>组合 ${i + 1}: ${g.name}</option>`

                    ).join('')}

                </select>

            </div>

        `;

        

        // 不存在时处理

        html += `

            <div class="form-group">

                <label>不存在时</label>

                <select id="prop-on_not_exists" onchange="onWindowNotExistsChange(this.value)">

                    <option value="continue" ${!step.on_not_exists || step.on_not_exists === 'continue' ? 'selected' : ''}>继续执行后续</option>

                    <option value="stop" ${step.on_not_exists === 'stop' ? 'selected' : ''}>停止当前组合</option>

                    <option value="jump" ${step.on_not_exists === 'jump' ? 'selected' : ''}>跳转组合</option>

                </select>

            </div>

        `;

        

        // 不存在时跳转组合选择

        html += `

            <div class="form-group" id="not-exists-jump-group" style="display: ${step.on_not_exists === 'jump' ? 'block' : 'none'};">

                <label>不存在时跳转到</label>

                <select id="prop-not_exists_jump_group" onchange="updateStepProperty('not_exists_jump_group', parseInt(this.value))">

                    ${workflow.groups.map((g, i) => 

                        `<option value="${i}" ${step.not_exists_jump_group === i ? 'selected' : ''}>组合 ${i + 1}: ${g.name}</option>`

                    ).join('')}

                </select>

            </div>

        `;

    } else {

        // 非图片识别类型的失败处理

        html += `

            <div class="form-group">

                <label>失败时</label>

                <select id="prop-on_fail" onchange="updateStepProperty('on_fail', this.value)">

                    <option value="continue" ${step.on_fail === 'continue' ? 'selected' : ''}>继续执行</option>

                    <option value="stop" ${step.on_fail === 'stop' ? 'selected' : ''}>停止流程</option>

                    <option value="retry" ${step.on_fail === 'retry' ? 'selected' : ''}>重试</option>

                </select>

            </div>

        `;

    }

    

    panel.innerHTML = multiSelectHint + html;

}



// 渲染字段

function renderField(field, value, step) {

    let html = `<div class="form-group">`;

    html += `<label>${field.label}</label>`;

    

    switch (field.type) {

        case 'number':

            const numStep = field.step || 1;

            const min = field.min !== undefined ? `min="${field.min}"` : '';

            const max = field.max !== undefined ? `max="${field.max}"` : '';

            // timeout 字段变化时需要重新渲染面板（因为有条件显示的字段依赖它）

            let numOnchange = `updateStepProperty('${field.name}', parseFloat(this.value) || 0)`;

            if (field.name === 'timeout') {

                numOnchange = `updateStepProperty('${field.name}', parseFloat(this.value) || 0); updatePropertiesPanel();`;

            }

            html += `<input type="number" id="prop-${field.name}" 

                     value="${value !== null && value !== undefined ? value : ''}" 

                     step="${numStep}" ${min} ${max}

                     onchange="${numOnchange}">`;

            break;

        case 'text':

            let displayValue = value;

            if (field.name === 'keys' && Array.isArray(value)) {

                displayValue = value.join(',');

            }

            // 图片字段特殊处理 - 显示图片选择器

            if (field.name === 'image') {

                html += `

                    <div class="image-selector">

                        <input type="text" id="prop-${field.name}" value="${value || ''}" readonly 

                               placeholder="点击选择图片" onclick="openImagePicker()">

                        <button type="button" class="btn btn-sm btn-primary" onclick="openImagePicker()">📷 选择</button>

                    </div>

                    <div id="image-offset-container" class="image-offset-container">

                        <div class="image-offset-hint">点击图片设置鼠标目标位置</div>

                        <div id="image-offset-preview" class="image-offset-preview">

                            <div id="offset-crosshair" class="offset-crosshair"></div>

                        </div>

                        <div class="offset-controls">

                            <span>偏移: X=<span id="offset-x-display">0</span> Y=<span id="offset-y-display">0</span></span>

                            <button type="button" class="btn btn-xs" onclick="resetImageOffset()">重置</button>

                        </div>

                    </div>

                `;

                // 显示当前选中的图片预览

                if (value) {

                    setTimeout(() => loadImageForOffset(value), 100);

                }

            } else if (field.name === 'key' || field.name === 'keys') {

                // 按键字段 - 添加识别按钮

                html += `

                    <div class="key-input-group">

                        <input type="text" id="prop-${field.name}" value="${displayValue || ''}"

                               onchange="updateStepProperty('${field.name}', this.value)"

                               placeholder="${field.name === 'keys' ? 'ctrl,c' : 'enter'}">

                        <button type="button" class="btn btn-sm" onclick="openKeyDetector('prop-${field.name}')" title="按键识别">⌨️ 识别</button>

                    </div>

                `;

            } else {

                html += `<input type="text" id="prop-${field.name}" value="${displayValue || ''}"

                         onchange="updateStepProperty('${field.name}', this.value)">`;

            }

            break;

        case 'textarea':

            html += `<textarea id="prop-${field.name}" 

                     onchange="updateStepProperty('${field.name}', this.value)">${value || ''}</textarea>`;

            break;

        case 'select':

            // 预设分辨率和位置需要特殊处理

            let onchangeHandler = `updateStepProperty('${field.name}', this.value)`;

            if (field.name === 'preset_size') {

                onchangeHandler = `handlePresetSize(this.value)`;

            } else if (field.name === 'preset_pos') {

                onchangeHandler = `handlePresetPos(this.value)`;

            } else if (field.name === 'action_type' || field.name === 'return_mode' || field.name === 'on_match' || field.name === 'on_mismatch' || field.name === 'on_timeout' || field.name === 'timeout') {

                // 这些字段变化时需要重新渲染属性面板（因为有条件显示的字段依赖它们）

                onchangeHandler = `updateStepProperty('${field.name}', this.value); updatePropertiesPanel();`;

            }

            

            // find_by 选项中文标签映射

            const findByLabelsMap = {

                'process_name': '进程名 (任务管理器详细信息)',

                'window_title': '窗口标题 (部分匹配)',

                'pid': 'PID (进程ID)'

            };

            

            html += `<select id="prop-${field.name}" onchange="${onchangeHandler}">`;

            field.options.forEach(opt => {

                const displayLabel = (field.name === 'find_by' && findByLabelsMap[opt]) ? findByLabelsMap[opt] : opt;

                html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${displayLabel}</option>`;

            });

            html += `</select>`;

            break;

        case 'multi_key':

            // 同时按住 - 多按键编辑器

            const keys = Array.isArray(value) ? value : [];

            html += `<div class="multi-key-editor" id="multi-key-editor">`;

            html += `<div class="multi-key-list" id="multi-key-list">`;

            keys.forEach((key, idx) => {

                html += renderMultiKeyItem(key, idx);

            });

            html += `</div>`;

            html += `<button type="button" class="btn btn-sm btn-primary" onclick="addMultiKey()">＋ 添加按键</button>`;

            html += `</div>`;

            break;

        case 'color':

            // 颜色选择器 - RGB格式

            const colorValue = Array.isArray(value) ? value : [255, 255, 255];

            const hexColor = rgbToHex(colorValue[0], colorValue[1], colorValue[2]);

            html += `

                <div class="color-picker-group">

                    <input type="color" id="prop-${field.name}-picker" value="${hexColor}"

                           onchange="updateColorFromPicker('${field.name}', this.value)">

                    <span class="color-rgb-display">RGB(${colorValue[0]}, ${colorValue[1]}, ${colorValue[2]})</span>

                </div>

                <div class="color-picker-buttons">

                    <button type="button" class="btn btn-sm btn-primary" onclick="startPickColorWithCoord('${field.name}')" title="从屏幕取色并获取坐标（按Enter确认）">📍 取色+坐标</button>

                    <button type="button" class="btn btn-sm" onclick="pickColorFromScreen('${field.name}')" title="仅取色（不获取坐标）">🎨 仅取色</button>

                </div>

            `;

            break;

        case 'region_list':

            // 变换识别 - 区域列表编辑器

            const regions = Array.isArray(value) ? value : [];

            html += `<div class="region-list-editor" id="region-list-editor">`;

            html += `<div class="region-list" id="region-list">`;

            if (regions.length === 0) {

                html += `<div class="empty-hint">暂无区域，点击下方按钮添加</div>`;

            } else {

                regions.forEach((region, idx) => {

                    html += renderRegionItem(region, idx);

                });

            }

            html += `</div>`;

            html += `<button type="button" class="btn btn-sm btn-primary" onclick="addRegion()">＋ 添加监控区域</button>`;

            html += `</div>`;

            break;

    }

    

    if (field.hint) {

        html += `<div class="form-hint">${field.hint}</div>`;

    }

    

    html += `</div>`;

    return html;

}



// 渲染单个按键项

function renderMultiKeyItem(key, index) {

    const keyType = key.type || 'keyboard';

    const keyName = key.key || '';

    const holdTime = key.hold_time || 0;

    

    return `

        <div class="multi-key-item" data-index="${index}">

            <select onchange="updateMultiKey(${index}, 'type', this.value)">

                <option value="keyboard" ${keyType === 'keyboard' ? 'selected' : ''}>键盘</option>

                <option value="mouse" ${keyType === 'mouse' ? 'selected' : ''}>鼠标</option>

            </select>

            <input type="text" value="${keyName}" placeholder="${keyType === 'keyboard' ? '如:a,ctrl,space' : 'left/right/middle'}"

                   onchange="updateMultiKey(${index}, 'key', this.value)" style="width:100px;">

            <input type="number" value="${holdTime}" step="0.1" min="0" style="width:70px;"

                   onchange="updateMultiKey(${index}, 'hold_time', parseFloat(this.value)||0)" title="按住时间(秒)">

            <span class="multi-key-hint">秒</span>

            <button type="button" class="btn btn-xs btn-danger" onclick="removeMultiKey(${index})">×</button>

        </div>

    `;

}



// 渲染单个区域项

function renderRegionItem(region, index) {

    const regionId = region.id || `区域${index + 1}`;

    const regionData = region.region || {};

    const targetImage = region.target_image || '未设置';

    const priority = region.priority !== undefined ? region.priority : index + 1;

    const actions = region.actions || [];

    const colorMatchIcon = region.color_match ? '🎨' : '⬛';

    const colorMatchText = region.color_match ? '彩色匹配' : '灰度匹配';

    

    return `

        <div class="region-item" data-index="${index}">

            <div class="region-header">

                <span class="region-badge">[${priority}]</span>

                <span class="region-id">${regionId}</span>

                <button type="button" class="btn btn-xs" onclick="editRegion(${index})">⚙️ 编辑</button>

                <button type="button" class="btn btn-xs btn-danger" onclick="removeRegion(${index})">×</button>

            </div>

            <div class="region-details">

                <div>📍 位置: (${regionData.x || 0}, ${regionData.y || 0}) ${regionData.width || 0}x${regionData.height || 0}</div>

                <div>🖼️ 目标: ${targetImage}</div>

                <div>${colorMatchIcon} ${colorMatchText} | ⚡ 动作: ${actions.length}个步骤</div>

            </div>

        </div>

    `;

}



// 添加监控区域

function addRegion() {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.regions) step.regions = [];

    

    const newIndex = step.regions.length;

    step.regions.push({

        id: `区域${newIndex + 1}`,

        priority: newIndex + 1,

        region: { x: 0, y: 0, width: 100, height: 100 },

        target_image: '',

        confidence: 0.75,  // 默认置信度

        actions: [

            { type: 'move', target: 'match_center', offset_x: 0, offset_y: 0, delay_after: 0.3 },

            { type: 'click', button: 'left', delay_after: 0.5 }

        ]

    });

    

    updatePropertiesPanel();

    updateCanvas();

}



// 编辑区域

function editRegion(index) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.regions || !step.regions[index]) return;

    

    const region = step.regions[index];

    

    // 打开对话框编辑区域

    const dialogHtml = `

        <div class="region-editor-dialog">

            <h3>编辑区域: ${region.id}</h3>

            

            <div class="form-group">

                <label>区域 ID</label>

                <input type="text" id="edit-region-id" value="${region.id}">

            </div>

            

            <div class="form-group">

                <label>优先级（数字越小越优先）</label>

                <input type="number" id="edit-region-priority" value="${region.priority}" min="1">

            </div>

            

            <div class="form-group">

                <label>监控区域</label>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">

                    <div>

                        <label>X 坐标</label>

                        <input type="number" id="edit-region-x" value="${region.region.x}">

                    </div>

                    <div>

                        <label>Y 坐标</label>

                        <input type="number" id="edit-region-y" value="${region.region.y}">

                    </div>

                    <div>

                        <label>宽度</label>

                        <input type="number" id="edit-region-width" value="${region.region.width}">

                    </div>

                    <div>

                        <label>高度</label>

                        <input type="number" id="edit-region-height" value="${region.region.height}">

                    </div>

                </div>

                <div style="display:flex; gap:8px; margin-top:8px;">

                    <button type="button" class="btn btn-sm btn-primary" onclick="pasteRegionCoords()">📋 粘贴坐标</button>

                </div>

                <div class="form-hint">提示：使用F9截图时选择"保存+复制"可同时复制图片名和坐标，粘贴后自动填充</div>

            </div>

            

            <div class="form-group">

                <label>目标图片</label>

                <input type="text" id="edit-region-image" value="${region.target_image}" readonly onclick="selectRegionImage(${index})">

                <button type="button" class="btn btn-sm" onclick="selectRegionImage(${index})">📷 选择</button>

            </div>

            

            <div class="form-group">

                <label>置信度</label>

                <input type="number" id="edit-region-confidence" value="${region.confidence}" min="0.5" max="1" step="0.05">

            </div>

            

            <div class="form-group">

                <label>颜色匹配</label>

                <div style="display:flex; align-items:center; gap:12px;">

                    <label style="margin:0; display:flex; align-items:center; cursor:pointer;">

                        <input type="checkbox" id="edit-region-color-match" ${region.color_match ? 'checked' : ''}>

                        <span style="margin-left:6px;">区分颜色（用于颜色变化识别）</span>

                    </label>

                </div>

                <div class="form-hint">启用后会识别图片的颜色差异（如红色/白色价格），关闭则只识别形状</div>

            </div>

            

            <div class="form-group">

                <label>动作序列</label>

                <div id="region-actions-list"></div>

                <button type="button" class="btn btn-sm" onclick="addRegionAction(${index})">＋ 添加动作</button>

            </div>

            

            <div class="dialog-buttons">

                <button type="button" class="btn btn-primary" onclick="saveRegionEdit(${index})">保存</button>

                <button type="button" class="btn" onclick="closeDialog()">取消</button>

            </div>

        </div>

    `;

    

    showDialog(dialogHtml);

    renderRegionActions(region.actions, index);

}



// 当前编辑的区域索引（用于动作编辑）

let _currentEditingRegionIndex = -1;



// 渲染区域动作列表

function renderRegionActions(actions, regionIndex) {

    _currentEditingRegionIndex = regionIndex !== undefined ? regionIndex : _currentEditingRegionIndex;

    

    const container = document.getElementById('region-actions-list');

    if (!container) return;

    

    if (!actions || actions.length === 0) {

        container.innerHTML = '<div class="empty-hint">暂无动作，点击下方添加</div>';

        return;

    }

    

    container.innerHTML = actions.map((action, idx) => {

        const typeLabel = {click: '🖱️ 点击', move: '➡️ 移动', key: '⌨️ 按键'}[action.type] || action.type;

        let details = '';

        if (action.type === 'click') {

            details = `(${action.button || 'left'}键)`;

        } else if (action.type === 'key') {

            details = `(${action.key || '未设置'})`;

        } else if (action.type === 'move') {

            details = '';

        }

        return `

            <div class="action-item" data-idx="${idx}" draggable="true">

                <span class="action-drag-handle" title="拖拽排序">☰</span>

                <span class="action-info">${idx + 1}. ${typeLabel} ${details}</span>

                <span class="action-delay">延迟 ${action.delay_after || 0}s</span>

                <button type="button" class="btn btn-xs" onclick="editRegionAction(${idx})" title="编辑">✏️</button>

                <button type="button" class="btn btn-xs btn-danger" onclick="removeRegionAction(${idx})" title="删除">×</button>

            </div>

        `;

    }).join('');

    

    // 绑定拖拽事件

    initActionDragSort(container, regionIndex);

}



// 动作拖拽排序

function initActionDragSort(container, regionIndex) {

    const items = container.querySelectorAll('.action-item');

    let draggedItem = null;

    

    items.forEach(item => {

        item.addEventListener('dragstart', (e) => {

            draggedItem = item;

            item.classList.add('dragging');

            e.dataTransfer.effectAllowed = 'move';

        });

        

        item.addEventListener('dragend', () => {

            item.classList.remove('dragging');

            draggedItem = null;

            // 移除所有拖拽指示

            items.forEach(i => i.classList.remove('drag-over'));

        });

        

        item.addEventListener('dragover', (e) => {

            e.preventDefault();

            if (draggedItem && draggedItem !== item) {

                item.classList.add('drag-over');

            }

        });

        

        item.addEventListener('dragleave', () => {

            item.classList.remove('drag-over');

        });

        

        item.addEventListener('drop', (e) => {

            e.preventDefault();

            item.classList.remove('drag-over');

            

            if (draggedItem && draggedItem !== item) {

                const fromIdx = parseInt(draggedItem.dataset.idx);

                const toIdx = parseInt(item.dataset.idx);

                reorderAction(fromIdx, toIdx, regionIndex);

            }

        });

    });

}



// 重新排序动作

function reorderAction(fromIdx, toIdx, regionIndex) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.regions || !step.regions[regionIndex]) return;

    

    const actions = step.regions[regionIndex].actions;

    const [movedAction] = actions.splice(fromIdx, 1);

    actions.splice(toIdx, 0, movedAction);

    

    renderRegionActions(actions, regionIndex);

}



// 添加区域动作

function addRegionAction(regionIndex) {

    _currentEditingRegionIndex = regionIndex;

    showActionEditDialog(-1, regionIndex);  // -1 表示新增

}



// 编辑区域动作

function editRegionAction(actionIndex) {

    showActionEditDialog(actionIndex, _currentEditingRegionIndex);

}



// 显示动作编辑对话框

function showActionEditDialog(actionIndex, regionIndex) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.regions || !step.regions[regionIndex]) return;

    

    const region = step.regions[regionIndex];

    const isNew = actionIndex < 0;

    const action = isNew ? { type: 'click', button: 'left', key: '', delay_after: 0.3 } : region.actions[actionIndex];

    

    const dialogHtml = `

        <div class="action-edit-dialog">

            <h3>${isNew ? '添加动作' : '编辑动作'}</h3>

            

            <div class="form-group">

                <label>动作类型</label>

                <select id="action-type" onchange="onActionTypeChange()">

                    <option value="click" ${action.type === 'click' ? 'selected' : ''}>🖱️ 鼠标点击</option>

                    <option value="move" ${action.type === 'move' ? 'selected' : ''}>➡️ 移动鼠标</option>

                    <option value="key" ${action.type === 'key' ? 'selected' : ''}>⌨️ 键盘按键</option>

                </select>

            </div>

            

            <div class="form-group" id="action-click-options" style="display:${action.type === 'click' ? 'block' : 'none'}">

                <label>鼠标按键</label>

                <select id="action-button">

                    <option value="left" ${action.button === 'left' ? 'selected' : ''}>左键</option>

                    <option value="right" ${action.button === 'right' ? 'selected' : ''}>右键</option>

                    <option value="middle" ${action.button === 'middle' ? 'selected' : ''}>中键</option>

                </select>

            </div>

            

            <div class="form-group" id="action-key-options" style="display:${action.type === 'key' ? 'block' : 'none'}">

                <label>按键</label>

                <div style="display:flex; gap:8px;">

                    <input type="text" id="action-key" value="${action.key || ''}" placeholder="如: space, enter, a, ctrl+c" style="flex:1;">

                    <button type="button" class="btn btn-sm" onclick="detectActionKey()">⌨️ 识别</button>

                </div>

            </div>

            

            <div class="form-group">

                <label>执行后延迟(秒)</label>

                <input type="number" id="action-delay" value="${action.delay_after || 0}" min="0" step="0.1">

            </div>

            

            <div class="dialog-buttons">

                <button type="button" class="btn btn-primary" onclick="saveActionEdit(${actionIndex}, ${regionIndex})">保存</button>

                <button type="button" class="btn" onclick="closeActionDialog()">取消</button>

            </div>

        </div>

    `;

    

    // 显示子对话框

    const overlay = document.createElement('div');

    overlay.id = 'action-dialog-overlay';

    overlay.className = 'dialog-overlay';

    overlay.style.zIndex = '10002';

    overlay.innerHTML = `<div class="dialog-content" style="max-width:400px;">${dialogHtml}</div>`;

    document.body.appendChild(overlay);

}



// 动作类型切换

function onActionTypeChange() {

    const type = document.getElementById('action-type').value;

    document.getElementById('action-click-options').style.display = type === 'click' ? 'block' : 'none';

    document.getElementById('action-key-options').style.display = type === 'key' ? 'block' : 'none';

}



// 保存动作编辑

function saveActionEdit(actionIndex, regionIndex) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.regions || !step.regions[regionIndex]) return;

    

    const region = step.regions[regionIndex];

    const type = document.getElementById('action-type').value;

    

    const newAction = {

        type: type,

        delay_after: parseFloat(document.getElementById('action-delay').value) || 0

    };

    

    if (type === 'click') {

        newAction.button = document.getElementById('action-button').value;

    } else if (type === 'key') {

        newAction.key = document.getElementById('action-key').value;

    } else if (type === 'move') {

        newAction.target = 'match_center';

        newAction.offset_x = 0;

        newAction.offset_y = 0;

    }

    

    if (actionIndex < 0) {

        // 新增

        region.actions.push(newAction);

    } else {

        // 编辑

        region.actions[actionIndex] = newAction;

    }

    

    closeActionDialog();

    renderRegionActions(region.actions, regionIndex);

}



// 关闭动作编辑对话框

function closeActionDialog() {

    const overlay = document.getElementById('action-dialog-overlay');

    if (overlay) overlay.remove();

}



// 按键识别

let _keyDetecting = false;

let _detectedKeys = [];



function detectActionKey() {

    if (_keyDetecting) return;

    

    const input = document.getElementById('action-key');

    if (!input) return;

    

    _keyDetecting = true;

    _detectedKeys = [];

    

    const btn = event.target;

    const originalText = btn.textContent;

    btn.textContent = '按下按键...';

    btn.style.background = '#ef4444';

    input.placeholder = '请按下任意按键或组合键...';

    input.focus();

    

    // 监听按键

    function onKeyDown(e) {

        e.preventDefault();

        

        // 记录按下的键

        const key = e.key.toLowerCase();

        if (!_detectedKeys.includes(key)) {

            _detectedKeys.push(key);

        }

        

        // 立即显示

        updateKeyDisplay();

    }

    

    function onKeyUp(e) {

        e.preventDefault();

        

        // 结束检测

        setTimeout(() => {

            if (_keyDetecting) {

                finishDetection();

            }

        }, 500);  // 500ms 后自动结束

    }

    

    function updateKeyDisplay() {

        // 转换为标准格式

        const keyStr = _detectedKeys

            .map(k => {

                // 特殊键映射

                const keyMap = {

                    'control': 'ctrl',

                    ' ': 'space',

                    'arrowup': 'up',

                    'arrowdown': 'down',

                    'arrowleft': 'left',

                    'arrowright': 'right',

                    'escape': 'esc'

                };

                return keyMap[k] || k;

            })

            .filter(k => k !== 'shift' && k !== 'ctrl' && k !== 'alt' || _detectedKeys.length === 1)

            .join('+');

        

        input.value = keyStr;

    }

    

    function finishDetection() {

        _keyDetecting = false;

        document.removeEventListener('keydown', onKeyDown);

        document.removeEventListener('keyup', onKeyUp);

        btn.textContent = originalText;

        btn.style.background = '';

        input.placeholder = '如: space, enter, a, ctrl+c';

    }

    

    document.addEventListener('keydown', onKeyDown);

    document.addEventListener('keyup', onKeyUp);

    

    // 5秒后自动取消

    setTimeout(() => {

        if (_keyDetecting) {

            finishDetection();

        }

    }, 5000);

}



// 移除区域动作

function removeRegionAction(actionIndex) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    const regionIndex = _currentEditingRegionIndex;

    if (!step.regions || !step.regions[regionIndex]) return;

    

    step.regions[regionIndex].actions.splice(actionIndex, 1);

    renderRegionActions(step.regions[regionIndex].actions, regionIndex);

}



// 保存区域编辑

function saveRegionEdit(index) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.regions || !step.regions[index]) return;

    

    const region = step.regions[index];

    region.id = document.getElementById('edit-region-id').value;

    region.priority = parseInt(document.getElementById('edit-region-priority').value) || 1;

    region.region.x = parseInt(document.getElementById('edit-region-x').value) || 0;

    region.region.y = parseInt(document.getElementById('edit-region-y').value) || 0;

    region.region.width = parseInt(document.getElementById('edit-region-width').value) || 100;

    region.region.height = parseInt(document.getElementById('edit-region-height').value) || 100;

    region.target_image = document.getElementById('edit-region-image').value;

    region.confidence = parseFloat(document.getElementById('edit-region-confidence').value) || 0.8;

    region.color_match = document.getElementById('edit-region-color-match').checked;

    

    closeDialog();

    updatePropertiesPanel();

    updateCanvas();

}



// 移除区域

function removeRegion(index) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.regions) return;

    

    step.regions.splice(index, 1);

    updatePropertiesPanel();

    updateCanvas();

}



// 粘贴坐标信息（支持同时粘贴图片名）

function pasteRegionCoords() {

    navigator.clipboard.readText().then(text => {

        let filename = null;

        let coordsText = text.trim();

        

        // 检查是否包含文件名（格式: filename|x,y,width,height）

        if (text.includes('|')) {

            const pipeParts = text.split('|');

            if (pipeParts.length === 2) {

                filename = pipeParts[0].trim();

                coordsText = pipeParts[1].trim();

            }

        }

        

        // 解析坐标格式: x,y,width,height

        const parts = coordsText.split(',');

        if (parts.length >= 4) {

            const x = parseInt(parts[0]);

            const y = parseInt(parts[1]);

            const width = parseInt(parts[2]);

            const height = parseInt(parts[3]);

            

            if (!isNaN(x) && !isNaN(y) && !isNaN(width) && !isNaN(height)) {

                document.getElementById('edit-region-x').value = x;

                document.getElementById('edit-region-y').value = y;

                document.getElementById('edit-region-width').value = width;

                document.getElementById('edit-region-height').value = height;

                

                // 如果有文件名，同时填入图片字段

                if (filename) {

                    const imageInput = document.getElementById('edit-region-image');

                    if (imageInput) {

                        imageInput.value = filename;

                    }

                    showToast(`坐标和图片名已粘贴\n${filename}`, 'success');

                } else {

                    showToast('坐标已粘贴', 'success');

                }

            } else {

                showToast('坐标格式错误', 'error');

            }

        } else {

            showToast('剪贴板内容格式不正确\n支持格式:\n1. x,y,width,height\n2. filename|x,y,width,height', 'error');

        }

    }).catch(err => {

        // 备用方案：弹出输入框

        const input = prompt('请粘贴坐标信息\n支持格式:\n1. x,y,width,height\n2. filename|x,y,width,height');

        if (input) {

            let filename = null;

            let coordsText = input.trim();

            

            if (input.includes('|')) {

                const pipeParts = input.split('|');

                if (pipeParts.length === 2) {

                    filename = pipeParts[0].trim();

                    coordsText = pipeParts[1].trim();

                }

            }

            

            const parts = coordsText.split(',');

            if (parts.length >= 4) {

                document.getElementById('edit-region-x').value = parseInt(parts[0]) || 0;

                document.getElementById('edit-region-y').value = parseInt(parts[1]) || 0;

                document.getElementById('edit-region-width').value = parseInt(parts[2]) || 100;

                document.getElementById('edit-region-height').value = parseInt(parts[3]) || 100;

                

                if (filename) {

                    const imageInput = document.getElementById('edit-region-image');

                    if (imageInput) {

                        imageInput.value = filename;

                    }

                }

            }

        }

    });

}



// 显示轻提示

function showToast(msg, type = 'info') {

    const toast = document.createElement('div');

    toast.className = `toast toast-${type}`;

    toast.textContent = msg;

    toast.style.cssText = `

        position: fixed;

        bottom: 20px;

        right: 20px;

        padding: 12px 20px;

        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#6366f1'};

        color: white;

        border-radius: 8px;

        z-index: 10001;

        animation: fadeInUp 0.3s ease;

    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);

}



// 选择区域图片

function selectRegionImage(index) {

    openImagePicker((imageName) => {

        document.getElementById('edit-region-image').value = imageName;

    });

}



// 显示对话框

function showDialog(html) {

    const overlay = document.createElement('div');

    overlay.id = 'dialog-overlay';

    overlay.className = 'dialog-overlay';

    overlay.innerHTML = `<div class="dialog-content">${html}</div>`;

    document.body.appendChild(overlay);

    

    overlay.addEventListener('click', (e) => {

        if (e.target === overlay) closeDialog();

    });

}



// 关闭对话框

function closeDialog() {

    const overlay = document.getElementById('dialog-overlay');

    if (overlay) overlay.remove();

}



// 添加按键

function addMultiKey() {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.keys) step.keys = [];

    

    step.keys.push({ type: 'keyboard', key: '', hold_time: 0.5 });

    updatePropertiesPanel();

    updateCanvas();

}



// 更新按键属性

function updateMultiKey(index, prop, value) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.keys || !step.keys[index]) return;

    

    step.keys[index][prop] = value;

    updateCanvas();

}



// 删除按键

function removeMultiKey(index) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0) return;

    

    const step = steps[selectedStepIndex];

    if (!step.keys) return;

    

    step.keys.splice(index, 1);

    updatePropertiesPanel();

    updateCanvas();

}



// 更新步骤属性

function updateStepProperty(property, value) {

    const steps = getCurrentSteps();

    if (selectedStepIndex < 0 || selectedStepIndex >= steps.length) return;

    

    // 特殊处理组合键

    if (property === 'keys' && typeof value === 'string') {

        value = value.split(',').map(k => k.trim()).filter(k => k);

    }

    // 特殊处理像素级定位的粘贴格式: 图片名|x,y,w,h
    if (property === 'image_coord' && value && typeof value === 'string') {
        const match = value.match(/^(.+)\|(\d+),(\d+),(\d+),(\d+)$/);
        if (match) {
            const [, imageName, x, y, w, h] = match;
            steps[selectedStepIndex]['image'] = imageName;
            // 计算目标坐标为区域中心
            steps[selectedStepIndex]['target_x'] = parseInt(x) + parseInt(w) / 2;
            steps[selectedStepIndex]['target_y'] = parseInt(y) + parseInt(h) / 2;
            updatePropertiesPanel();
            updateCanvas();
            return;
        }
    }

    // 检查当前步骤是否是批量可改，如果是则同步到所有相同的步骤
    const currentStep = steps[selectedStepIndex];
    const oldStepJson = JSON.stringify(currentStep);
    
    // 先更新当前步骤
    steps[selectedStepIndex][property] = value;
    
    // 检查是否有批量可改配置（支持跨组合同步）
    if (workflow.editable_config && workflow.editable_config.items) {
        // 找到当前步骤的配置项
        const currentItem = workflow.editable_config.items.find(
            item => item.group_index === currentGroupIndex && 
                    item.step_index === selectedStepIndex
        );
        
        // 如果当前步骤是批量可改的，且有batch_id
        if (currentItem && currentItem.mode === 'batch' && currentItem.batch_id) {
            const batchId = currentItem.batch_id;
            // 找到所有相同batch_id的步骤并同步
            workflow.editable_config.items.forEach(item => {
                if (item.mode === 'batch' && 
                    item.batch_id === batchId &&
                    !(item.group_index === currentGroupIndex && item.step_index === selectedStepIndex)) {
                    // 获取目标组合的步骤
                    const targetGroup = workflow.groups[item.group_index];
                    if (targetGroup && targetGroup.steps && targetGroup.steps[item.step_index]) {
                        targetGroup.steps[item.step_index][property] = value;
                    }
                }
            });
        }
    }

    updateCanvas();

}


// 区域限定 - 解析粘贴的截图信息
function parseRegionPaste() {
    const input = document.getElementById('region-paste-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    
    // 格式: filename.png|x,y,width,height
    const match = val.match(/^(.+?)\|(\d+),(\d+),(\d+),(\d+)$/);
    if (match) {
        const [, imageName, x, y, w, h] = match;
        updateStepProperty('image', imageName);
        updateStepProperty('region_enabled', true);
        updateStepProperty('region', {x: parseInt(x), y: parseInt(y), width: parseInt(w), height: parseInt(h)});
        input.value = '';
        updatePropertiesPanel();
    } else {
        alert('格式不正确，请粘贴如: screenshot_xxx.png|550,951,288,148');
    }
}

// 区域限定 - 更新单个区域字段
function updateRegionField(field, value) {
    const steps = getCurrentSteps();
    if (selectedStepIndex < 0 || selectedStepIndex >= steps.length) return;
    const step = steps[selectedStepIndex];
    if (!step.region) step.region = {x: 0, y: 0, width: 0, height: 0};
    step.region[field] = value;
    updateCanvas();
}


// 图片识别失败处理变化

function onImageFailChange(value) {

    updateStepProperty('on_fail', value);

    const jumpGroup = document.getElementById('fail-jump-group');

    if (jumpGroup) {

        jumpGroup.style.display = value === 'jump' ? 'block' : 'none';

        // 选择跳转时，初始化跳转目标为当前选中值（确保有值）

        if (value === 'jump') {

            const select = document.getElementById('prop-fail_jump_group');

            if (select) {

                updateStepProperty('fail_jump_group', parseInt(select.value) || 0);

            }

        }

    }

}



// 图片识别成功处理变化

function onImageSuccessChange(value) {

    updateStepProperty('on_success', value);

    const jumpGroup = document.getElementById('success-jump-group');

    if (jumpGroup) {

        jumpGroup.style.display = value === 'jump' ? 'block' : 'none';

        // 选择跳转时，初始化跳转目标为当前选中值（确保有值）

        if (value === 'jump') {

            const select = document.getElementById('prop-success_jump_group');

            if (select) {

                updateStepProperty('success_jump_group', parseInt(select.value) || 0);

            }

        }

    }

}



// 窗口存在时处理变化

function onWindowExistsChange(value) {

    updateStepProperty('on_exists', value);

    const jumpGroup = document.getElementById('exists-jump-group');

    if (jumpGroup) {

        jumpGroup.style.display = value === 'jump' ? 'block' : 'none';

        // 选择跳转时，初始化跳转目标为当前选中值（确保有值）

        if (value === 'jump') {

            const select = document.getElementById('prop-exists_jump_group');

            if (select) {

                updateStepProperty('exists_jump_group', parseInt(select.value) || 0);

            }

        }

    }

}



// 窗口不存在时处理变化

function onWindowNotExistsChange(value) {

    updateStepProperty('on_not_exists', value);

    const jumpGroup = document.getElementById('not-exists-jump-group');

    if (jumpGroup) {

        jumpGroup.style.display = value === 'jump' ? 'block' : 'none';

        // 选择跳转时，初始化跳转目标为当前选中值（确保有值）

        if (value === 'jump') {

            const select = document.getElementById('prop-not_exists_jump_group');

            if (select) {

                updateStepProperty('not_exists_jump_group', parseInt(select.value) || 0);

            }

        }

    }

}



// 移动步骤

function moveStep(index, direction) {

    const steps = getCurrentSteps();

    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= steps.length) return;

    

    const temp = steps[index];

    steps[index] = steps[newIndex];

    steps[newIndex] = temp;

    

    if (selectedStepIndex === index) {

        selectedStepIndex = newIndex;

    } else if (selectedStepIndex === newIndex) {

        selectedStepIndex = index;

    }

    

    updateCanvas();

}



// 重排步骤

function reorderStep(fromIndex, toIndex) {

    const steps = getCurrentSteps();

    const step = steps.splice(fromIndex, 1)[0];

    steps.splice(toIndex, 0, step);

    

    if (selectedStepIndex === fromIndex) {

        selectedStepIndex = toIndex;

    }

    

    updateCanvas();

}



// 删除步骤

function deleteStep(index) {

    // 直接获取当前canvas的scrollTop（不依赖全局变量）

    const canvas = document.getElementById('canvas');

    const currentScrollTop = canvas.scrollTop;

    

    const steps = getCurrentGroup().steps;

    steps.splice(index, 1);

    

    // 更新多选状态：移除已删除的索引，调整其他索引

    const newSelectedIndices = new Set();

    selectedStepIndices.forEach(i => {

        if (i < index) {

            newSelectedIndices.add(i);

        } else if (i > index) {

            newSelectedIndices.add(i - 1);

        }

        // i === index 的情况：已删除，不添加

    });

    selectedStepIndices = newSelectedIndices;

    

    // 更新主选中索引

    if (selectedStepIndex === index) {

        selectedStepIndex = selectedStepIndices.size > 0 ? Math.min(...selectedStepIndices) : -1;

    } else if (selectedStepIndex > index) {

        selectedStepIndex--;

    }

    

    if (selectedStepIndex >= steps.length) {

        selectedStepIndex = steps.length - 1;

    }

    

    // 临时设置canvasScrollTop，确保updateCanvas使用正确的值

    canvasScrollTop = currentScrollTop;

    

    updateCanvas();

    updatePropertiesPanel();

    

    // 强制再次恢复滚动位置

    requestAnimationFrame(() => {

        canvas.scrollTop = currentScrollTop;

    });

}



// 初始化工具栏

function initToolbar() {

    document.getElementById('btn-new').addEventListener('click', newWorkflow);

    document.getElementById('btn-open').addEventListener('click', showOpenDialog);

    // 受限模式下保存按钮调用不同的保存函数
    document.getElementById('btn-save').addEventListener('click', function() {
        if (isEditableMode) {
            saveEditableConfig();
        } else {
            showSaveDialog();
        }
    });

    document.getElementById('btn-clear').addEventListener('click', clearWorkflow);

    document.getElementById('btn-add-group').addEventListener('click', addGroup);

    document.getElementById('btn-edit-desc').addEventListener('click', openDescEditor);

    

    document.getElementById('workflow-name').addEventListener('change', function() {

        workflow.name = this.value;

    });
    
    // 受限模式下隐藏打开和编辑说明按钮
    if (isEditableMode) {
        const btnOpen = document.getElementById('btn-open');
        const btnEditDesc = document.getElementById('btn-edit-desc');
        if (btnOpen) btnOpen.style.display = 'none';
        if (btnEditDesc) btnEditDesc.style.display = 'none';
    }

}



// 初始化组合设置

function initGroupSettings() {

    document.getElementById('group-name').addEventListener('change', function() {

        getCurrentGroup().name = this.value;

        updateGroupTabs();

    });

    

    // 执行模式按钮组点击事件

    document.querySelectorAll('.loop-mode-btn').forEach(btn => {

        btn.addEventListener('click', function() {

            const mode = this.dataset.mode;

            const group = getCurrentGroup();

            

            // 更新按钮状态

            document.querySelectorAll('.loop-mode-btn').forEach(b => b.classList.remove('active'));

            this.classList.add('active');

            

            // 更新组合属性

            group.loop_mode = mode;

            

            // 显示/隐藏输入框

            updateLoopValueDisplay(mode, group);

            updateGroupTabs();

        });

    });

    

    document.getElementById('group-loop-value').addEventListener('change', function() {

        const group = getCurrentGroup();

        const mode = group.loop_mode || 'once';

        const value = parseInt(this.value) || 1;

        

        if (mode === 'count') {

            group.loop_count = value;

        } else if (mode === 'duration') {

            group.loop_duration = value;

        }

        updateGroupTabs();

    });

}



function updateLoopValueDisplay(mode, group) {

    const valueInput = document.getElementById('group-loop-value');

    const unitSpan = document.getElementById('group-loop-unit');

    

    if (mode === 'count') {

        valueInput.classList.add('show');

        unitSpan.classList.add('show');

        unitSpan.textContent = '次';

        valueInput.value = group.loop_count || 1;

    } else if (mode === 'duration') {

        valueInput.classList.add('show');

        unitSpan.classList.add('show');

        unitSpan.textContent = '秒';

        valueInput.value = group.loop_duration || 60;

    } else {

        valueInput.classList.remove('show');

        unitSpan.classList.remove('show');

    }

}



// 更新组合标签

function updateGroupTabs() {

    const tabList = document.getElementById('groups-tab-list');

    tabList.innerHTML = '';

    

    workflow.groups.forEach((group, index) => {

        const tab = document.createElement('div');

        tab.className = 'group-tab' + (index === currentGroupIndex ? ' active' : '');

        tab.draggable = true;

        tab.dataset.index = index;

        tab.onclick = (e) => {

            if (!e.target.classList.contains('group-tab-delete')) {

                selectGroup(index);

            }

        };

        

        // 拖拽事件

        tab.ondragstart = (e) => {

            e.dataTransfer.setData('text/plain', index);

            tab.classList.add('dragging');

        };

        tab.ondragend = () => {

            tab.classList.remove('dragging');

        };

        tab.ondragover = (e) => {

            e.preventDefault();

            tab.classList.add('drag-over');

        };

        tab.ondragleave = () => {

            tab.classList.remove('drag-over');

        };

        tab.ondrop = (e) => {

            e.preventDefault();

            tab.classList.remove('drag-over');

            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));

            const toIndex = index;

            if (fromIndex !== toIndex) {

                moveGroup(fromIndex, toIndex);

            }

        };

        

        let loopInfo = '';

        const mode = group.loop_mode || 'once';

        if (mode === 'infinite') {

            loopInfo = '∞';

        } else if (mode === 'count' && group.loop_count > 1) {

            loopInfo = `×${group.loop_count}`;

        } else if (mode === 'duration' && group.loop_duration > 0) {

            loopInfo = `${group.loop_duration}秒`;

        }

        

        const isDefault = (workflow.default_group || 0) === index;

        

        tab.innerHTML = `

            ${isDefault ? '<span class="group-tab-default" title="默认启动组合">⭐</span>' : ''}

            <span class="group-tab-number">${index + 1}</span>

            <span class="group-tab-name">${group.name || '组合 ' + (index + 1)}</span>

            ${loopInfo ? `<span class="group-tab-loop">${loopInfo}</span>` : ''}

            ${workflow.groups.length > 1 ? `<button class="group-tab-delete" onclick="event.stopPropagation(); deleteGroup(${index})">×</button>` : ''}

        `;

        

        // 右键菜单设置默认组合

        tab.oncontextmenu = (e) => {

            e.preventDefault();

            setDefaultGroup(index);

        };

        

        tabList.appendChild(tab);

    });

}



// 设置默认启动组合

function setDefaultGroup(index) {

    workflow.default_group = index;

    updateGroupTabs();

    updateDefaultButton();

    showMsg(`已将「${workflow.groups[index].name || '组合 ' + (index + 1)}」设为默认启动组合`, 'success');

}



// 设置当前组合为默认

function setCurrentAsDefault() {

    setDefaultGroup(currentGroupIndex);

}



// 更新默认按钮状态

function updateDefaultButton() {

    const btn = document.getElementById('set-default-btn');

    if (btn) {

        const isDefault = (workflow.default_group || 0) === currentGroupIndex;

        if (isDefault) {

            btn.textContent = '⭐ 默认组合';

            btn.classList.add('btn-success');

        } else {

            btn.textContent = '⭐ 设为默认';

            btn.classList.remove('btn-success');

        }

    }

}



// 移动组合位置

function moveGroup(fromIndex, toIndex) {

    const group = workflow.groups.splice(fromIndex, 1)[0];

    workflow.groups.splice(toIndex, 0, group);

    

    // 更新默认组合索引

    const defaultGroup = workflow.default_group || 0;

    if (defaultGroup === fromIndex) {

        workflow.default_group = toIndex;

    } else if (fromIndex < defaultGroup && toIndex >= defaultGroup) {

        workflow.default_group = defaultGroup - 1;

    } else if (fromIndex > defaultGroup && toIndex <= defaultGroup) {

        workflow.default_group = defaultGroup + 1;

    }

    

    // 更新当前选中索引

    if (currentGroupIndex === fromIndex) {

        currentGroupIndex = toIndex;

    } else if (fromIndex < currentGroupIndex && toIndex >= currentGroupIndex) {

        currentGroupIndex--;

    } else if (fromIndex > currentGroupIndex && toIndex <= currentGroupIndex) {

        currentGroupIndex++;

    }

    

    updateGroupTabs();

    updateGroupSettings();

}



// 更新组合设置显示

function updateGroupSettings() {

    const group = getCurrentGroup();

    document.getElementById('group-name').value = group.name || '';

    

    // 兼容旧数据

    let mode = group.loop_mode || 'once';

    if (!group.loop_mode) {

        if (group.loop_enabled) {

            mode = 'infinite';

        } else if (group.loop_duration > 0) {

            mode = 'duration';

        } else if (group.loop_count > 1) {

            mode = 'count';

        }

        group.loop_mode = mode;

    }

    

    // 更新按钮状态

    document.querySelectorAll('.loop-mode-btn').forEach(btn => {

        btn.classList.toggle('active', btn.dataset.mode === mode);

    });

    

    // 更新输入框显示

    updateLoopValueDisplay(mode, group);

}



// 选择组合

function selectGroup(index) {

    if (index < 0 || index >= workflow.groups.length) return;

    // 切换前保存当前组合的人类化设置

    if (currentGroupIndex !== index) {

        saveHumanizeSettings();

    }

    currentGroupIndex = index;

    // 清空选择状态

    selectedStepIndex = -1;

    selectedStepIndices.clear();

    updateGroupTabs();

    updateGroupSettings();

    updateHumanizeSettings();  // 加载新组合的人类化设置

    updateDefaultButton();     // 更新默认按钮状态

    updateCanvas();

    updatePropertiesPanel();

}



// ==================== 人类化设置 ====================



// 更新当前组合的人类化设置界面

function updateHumanizeSettings() {

    const group = getCurrentGroup();

    if (!group.humanize) {

        group.humanize = {

            enabled: true,

            position_range: 3,

            delay_min: 20,

            delay_max: 150

        };

    }

    

    document.getElementById('humanize-enabled').checked = group.humanize.enabled !== false;

    document.getElementById('humanize-position').value = group.humanize.position_range || 3;

    document.getElementById('humanize-delay-min').value = group.humanize.delay_min || 20;

    document.getElementById('humanize-delay-max').value = group.humanize.delay_max || 150;

}



// 保存当前组合的人类化设置

function saveHumanizeSettings() {

    const group = getCurrentGroup();

    group.humanize = {

        enabled: document.getElementById('humanize-enabled').checked,

        position_range: parseInt(document.getElementById('humanize-position').value) || 3,

        delay_min: parseInt(document.getElementById('humanize-delay-min').value) || 20,

        delay_max: parseInt(document.getElementById('humanize-delay-max').value) || 150

    };

}



// 添加组合

function addGroup() {

    // 先保存当前组合的人类化设置

    saveHumanizeSettings();

    

    const newIndex = workflow.groups.length;

    workflow.groups.push({

        name: `组合 ${newIndex + 1}`,

        steps: [],

        loop_mode: 'once',

        loop_count: 1,

        loop_duration: 0,

        humanize: {

            enabled: true,

            position_range: 3,

            delay_min: 20,

            delay_max: 150

        }

    });

    selectGroup(newIndex);

}



// 删除组合

async function deleteGroup(index) {

    if (workflow.groups.length <= 1) {

        showMsg('至少保留一个组合', 'warning');

        return;

    }

    

    if (!await showConfirm(`确定要删除组合 ${index + 1} 吗？`)) {

        return;

    }

    

    workflow.groups.splice(index, 1);

    

    // 调整默认组合索引

    const defaultGroup = workflow.default_group || 0;

    if (defaultGroup === index) {

        workflow.default_group = 0;  // 被删除的是默认组合，重置为第一个

    } else if (defaultGroup > index) {

        workflow.default_group = defaultGroup - 1;  // 默认组合在被删除的后面，索引减1

    }

    

    // 调整当前组合索引

    if (currentGroupIndex >= workflow.groups.length) {

        currentGroupIndex = workflow.groups.length - 1;

    }

    

    selectGroup(currentGroupIndex);

}



// 新建流程

async function newWorkflow() {

    const hasSteps = workflow.groups.some(g => g.steps.length > 0);

    if (hasSteps) {

        if (!await showConfirm('确定要新建流程吗？当前未保存的更改将丢失。')) {

            return;

        }

    }

    

    workflow = {

        name: '新建流程',

        description: '',

        default_group: 0,

        groups: [{

            name: '组合 1',

            steps: [],

            loop_mode: 'once',

            loop_count: 1,

            loop_duration: 0,

            humanize: {

                enabled: true,

                position_range: 3,

                delay_min: 20,

                delay_max: 150

            }

        }]

    };

    currentFilename = null;

    currentGroupIndex = 0;

    selectedStepIndex = -1;

    selectedStepIndices.clear();

    workflowDescription = '';

    workflowDetailUrl = '';

    document.getElementById('workflow-name').value = workflow.name;

    updateHumanizeSettings();

    updateGroupTabs();

    updateGroupSettings();

    updateDefaultButton();

    updateCanvas();

    updatePropertiesPanel();

}



// 清空当前组合步骤

async function clearWorkflow() {

    const steps = getCurrentSteps();

    if (steps.length === 0) return;

    

    if (!await showConfirm('确定要清空当前组合的所有步骤吗？')) {

        return;

    }

    

    getCurrentGroup().steps = [];

    selectedStepIndex = -1;

    selectedStepIndices.clear();

    updateCanvas();

    updatePropertiesPanel();

}



// 显示打开对话框

function showOpenDialog() {

    document.getElementById('open-dialog').style.display = 'flex';

    loadWorkflowList();

}



// 关闭打开对话框

function closeOpenDialog() {

    document.getElementById('open-dialog').style.display = 'none';

}



// 加载工作流列表

async function loadWorkflowList() {

    const listEl = document.getElementById('workflow-list');

    listEl.innerHTML = '<p>加载中...</p>';

    

    try {

        const response = await fetch('/api/workflows');

        const workflows = await response.json();

        

        if (workflows.length === 0) {

            listEl.innerHTML = '<p class="empty-hint">暂无保存的流程</p>';

            return;

        }

        

        listEl.innerHTML = workflows.map(w => `

            <div class="workflow-item" onclick="openWorkflow('${w.filename}')">

                <div class="workflow-item-info">

                    <h4>${w.name}</h4>

                    <p>${w.description || '无描述'} · ${w.groups_count || 1}个组合 · ${w.steps_count}个步骤</p>

                </div>

                <div class="workflow-item-actions">

                    <button class="step-btn delete" onclick="event.stopPropagation(); deleteWorkflow('${w.filename}')" title="删除">×</button>

                </div>

            </div>

        `).join('');

    } catch (error) {

        listEl.innerHTML = '<p class="empty-hint">加载失败</p>';

    }

}



// 打开工作流

async function openWorkflow(filename) {

    try {

        const response = await fetch(`/api/workflow/${filename}`);

        const data = await response.json();

        

        // 兼容旧格式：如果没有groups但有steps，转换为新格式

        if (!data.groups && data.steps) {

            data.groups = [{

                name: '组合 1',

                steps: data.steps,

                loop_mode: 'once',

                loop_count: 1,

                loop_duration: 0

            }];

            delete data.steps;

        }

        

        // 确保有groups数组

        if (!data.groups || data.groups.length === 0) {

            data.groups = [{

                name: '组合 1',

                steps: [],

                loop_mode: 'once',

                loop_count: 1,

                loop_duration: 0

            }];

        }

        

        // 确保每个组合都有humanize配置（兼容旧配置）

        data.groups.forEach(group => {

            if (!group.humanize) {

                group.humanize = {

                    enabled: true,

                    position_range: 3,

                    delay_min: 20,

                    delay_max: 150

                };

            }

        });

        

        // 确保有 editable_config（兼容旧配置）

        if (!data.editable_config) {

            data.editable_config = { enabled: false, items: [] };

        }

        

        workflow = data;

        currentFilename = filename;

        currentGroupIndex = 0;

        selectedStepIndex = -1;

        selectedStepIndices.clear();

        workflowDescription = workflow.description || '';

        workflowDetailUrl = workflow.detail_url || '';

        // 从配置中恢复坐标获取模式（若存在）

        if (workflow.coord_capture_mode && ['both', 'timeout', 'click'].includes(workflow.coord_capture_mode)) {

            setCoordCaptureMode(workflow.coord_capture_mode);

        }

        document.getElementById('workflow-name').value = workflow.name || '未命名';

        updateHumanizeSettings();

        updateGroupTabs();

        updateGroupSettings();

        updateDefaultButton();

        updateCanvas();

        updatePropertiesPanel();

        closeOpenDialog();

    } catch (error) {

        showMsg('打开失败: ' + error.message, 'error');

    }

}



// 删除工作流

async function deleteWorkflow(filename) {

    if (!await showConfirm(`确定要删除 "${filename}" 吗？`)) {

        return;

    }

    

    try {

        await fetch(`/api/workflow/${filename}`, { method: 'DELETE' });

        loadWorkflowList();

    } catch (error) {

        showMsg('删除失败: ' + error.message, 'error');

    }

}



// 显示保存对话框

function showSaveDialog() {

    document.getElementById('save-dialog').style.display = 'flex';

    // 如果有当前文件名则使用，否则根据workflow.name生成
    // 注意：不要给加密文件添加.json后缀
    let defaultFilename = currentFilename;
    if (!defaultFilename) {
        defaultFilename = workflow.name || '新建流程';
        if (!defaultFilename.endsWith('.enc')) {
            defaultFilename = defaultFilename.replace(/\.json$/, '') + '.enc';
        }
    }
    document.getElementById('save-filename').value = defaultFilename;

    document.getElementById('save-description').value = workflow.description || '';

}



// 关闭保存对话框

function closeSaveDialog() {

    document.getElementById('save-dialog').style.display = 'none';

}



// 确认保存

async function confirmSave() {

    let filename = document.getElementById('save-filename').value.trim();

    

    if (!filename) {

        showMsg('请输入文件名', 'warning');

        return;

    }

    

    if (!filename.endsWith('.enc')) {
        filename = filename.replace(/\.json$/, '') + '.enc';
    }

    

    workflow.name = document.getElementById('workflow-name').value;

    workflow.description = workflowDescription;

    workflow.detail_url = workflowDetailUrl;

    // 保存坐标获取模式到 workflow（跟随配置文件持久化）

    workflow.coord_capture_mode = getCoordCaptureMode();

    

    // 保存当前组合的人类化设置

    saveHumanizeSettings();

    

    try {

        const response = await fetch(`/api/workflow/${filename}`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(workflow)

        });

        

        const result = await response.json();

        

        if (result.success) {

            currentFilename = filename;

            showMsg('保存成功！', 'success');

            closeSaveDialog();

        } else {

            showMsg('保存失败: ' + result.error, 'error');

        }

    } catch (error) {

        showMsg('保存失败: ' + error.message, 'error');

    }

}



// 快捷键支持

document.addEventListener('keydown', function(e) {

    // 如果焦点在输入框或文本框中，不处理快捷键（除了Escape）

    const activeEl = document.activeElement;

    const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

    

    // Ctrl+S 保存

    if (e.ctrlKey && e.key === 's') {

        e.preventDefault();

        showSaveDialog();

        return;

    }

    

    // Ctrl+C 复制选中步骤

    if (e.ctrlKey && e.key === 'c' && !isInputFocused) {

        e.preventDefault();

        copySelectedSteps();

        return;

    }

    

    // Ctrl+V 粘贴步骤

    if (e.ctrlKey && e.key === 'v' && !isInputFocused) {

        e.preventDefault();

        pasteSteps();

        return;

    }

    

    // Ctrl+A 全选步骤

    if (e.ctrlKey && e.key === 'a' && !isInputFocused) {

        e.preventDefault();

        selectAllSteps();

        return;

    }

    

    // Delete 删除选中步骤（支持多选）

    if (e.key === 'Delete' && !isInputFocused) {

        if (selectedStepIndices.size > 0) {

            confirmDeleteSelected();

        }

        return;

    }

    

    // Escape 取消选择/关闭弹窗

    if (e.key === 'Escape') {

        hideContextMenu();

        if (selectedStepIndices.size > 0) {

            clearSelection();

        }

        closeOpenDialog();

        closeSaveDialog();

        return;

    }

});



// ==================== 图片选择功能 ====================



// 缓存图片列表

let cachedImageList = [];



// 加载图片列表

async function loadImageList(selectedValue) {

    try {

        const response = await fetch('/api/images');

        const images = await response.json();

        cachedImageList = images;

        

        const select = document.getElementById('prop-image');

        if (!select) return;

        

        // 清空并重新填充选项

        select.innerHTML = '<option value="">-- 选择图片 --</option>';

        images.forEach(img => {

            const option = document.createElement('option');

            option.value = img.filename;

            option.textContent = img.filename;

            if (img.filename === selectedValue) {

                option.selected = true;

            }

            select.appendChild(option);

        });

        

        // 如果有选中值，显示预览

        if (selectedValue) {

            previewImage(selectedValue);

        }

    } catch (error) {

        console.error('加载图片列表失败:', error);

    }

}



// 刷新图片列表

function refreshImageList() {

    const steps = getCurrentSteps();

    const currentValue = steps[selectedStepIndex]?.image || '';

    loadImageList(currentValue);

}



// 预览图片

function previewImage(filename) {

    const preview = document.getElementById('image-preview');

    if (!preview) return;

    

    if (!filename) {

        preview.innerHTML = '<p class="empty-hint">未选择图片</p>';

        return;

    }

    

    preview.innerHTML = `

        <img src="/api/image/${filename}?_token=${_API_TOKEN}" alt="${filename}" onerror="this.parentElement.innerHTML='<p class=\\'empty-hint\\'>图片加载失败</p>'">

        <p>${filename}</p>

    `;

}



// 加载图片用于偏移调整

let currentOffsetImage = { width: 0, height: 0 };



function loadImageForOffset(filename) {

    const container = document.getElementById('image-offset-container');

    const preview = document.getElementById('image-offset-preview');

    if (!container || !preview) return;

    

    if (!filename) {

        container.style.display = 'none';

        return;

    }

    

    container.style.display = 'block';

    

    const img = new Image();

    img.onload = function() {

        currentOffsetImage = { width: img.width, height: img.height };

        preview.style.backgroundImage = `url(/api/image/${filename}?_token=${_API_TOKEN})`;

        preview.style.width = Math.min(img.width, 300) + 'px';

        preview.style.height = Math.min(img.height, 200) + 'px';

        preview.style.backgroundSize = 'contain';

        

        // 更新十字标记位置

        updateOffsetCrosshair();

    };

    img.onerror = function() {

        container.style.display = 'none';

    };

    img.src = `/api/image/${filename}?_token=${_API_TOKEN}`;

}



function updateOffsetCrosshair() {

    const preview = document.getElementById('image-offset-preview');

    const crosshair = document.getElementById('offset-crosshair');

    if (!preview || !crosshair) return;

    

    const steps = getCurrentSteps();

    const step = steps[selectedStepIndex];

    if (!step) return;

    

    const offsetX = step.offset_x || 0;

    const offsetY = step.offset_y || 0;

    

    // 计算十字标记位置（相对于预览区域）

    const previewWidth = preview.offsetWidth;

    const previewHeight = preview.offsetHeight;

    

    // 偏移相对于图片中心，转换为预览区域的像素位置

    const scale = Math.min(previewWidth / currentOffsetImage.width, previewHeight / currentOffsetImage.height);

    const centerX = previewWidth / 2;

    const centerY = previewHeight / 2;

    

    const posX = centerX + offsetX * scale;

    const posY = centerY + offsetY * scale;

    

    crosshair.style.left = posX + 'px';

    crosshair.style.top = posY + 'px';

    

    // 更新显示

    document.getElementById('offset-x-display').textContent = offsetX;

    document.getElementById('offset-y-display').textContent = offsetY;

}



function handleOffsetClick(event) {

    const preview = document.getElementById('image-offset-preview');

    if (!preview || currentOffsetImage.width === 0) return;

    

    const rect = preview.getBoundingClientRect();

    const clickX = event.clientX - rect.left;

    const clickY = event.clientY - rect.top;

    

    const previewWidth = preview.offsetWidth;

    const previewHeight = preview.offsetHeight;

    

    // 计算缩放比例

    const scale = Math.min(previewWidth / currentOffsetImage.width, previewHeight / currentOffsetImage.height);

    

    // 计算相对于中心的偏移（原始图片像素）

    const centerX = previewWidth / 2;

    const centerY = previewHeight / 2;

    

    const offsetX = Math.round((clickX - centerX) / scale);

    const offsetY = Math.round((clickY - centerY) / scale);

    

    // 更新步骤属性

    updateStepProperty('offset_x', offsetX);

    updateStepProperty('offset_y', offsetY);

    

    // 更新十字标记

    updateOffsetCrosshair();

    

    // 更新输入框（如果存在）

    const inputX = document.getElementById('prop-offset_x');

    const inputY = document.getElementById('prop-offset_y');

    if (inputX) inputX.value = offsetX;

    if (inputY) inputY.value = offsetY;

}



function resetImageOffset() {

    updateStepProperty('offset_x', 0);

    updateStepProperty('offset_y', 0);

    updateOffsetCrosshair();

    

    const inputX = document.getElementById('prop-offset_x');

    const inputY = document.getElementById('prop-offset_y');

    if (inputX) inputX.value = 0;

    if (inputY) inputY.value = 0;

}



// 初始化偏移预览点击事件

document.addEventListener('click', function(e) {

    if (e.target.id === 'image-offset-preview' || e.target.closest('#image-offset-preview')) {

        handleOffsetClick(e);

    }

});



// ==================== 图片选择弹窗 ====================



function openImagePicker() {

    document.getElementById('image-picker-dialog').style.display = 'flex';

    refreshImagePickerList();

}



function closeImagePickerDialog() {

    document.getElementById('image-picker-dialog').style.display = 'none';

}



function refreshImagePickerList() {

    const grid = document.getElementById('image-picker-grid');

    const countEl = document.getElementById('image-picker-count');

    grid.innerHTML = '<p style="text-align: center; color: gray; grid-column: span 4;">加载中...</p>';

    

    // 获取当前选中的图片

    const steps = getCurrentSteps();

    const currentImage = steps[selectedStepIndex]?.image || '';

    

    fetch('/api/images')

        .then(res => res.json())

        .then(images => {

            if (images.length === 0) {

                grid.innerHTML = '<div class="image-picker-empty">📷 暂无图片<br><small>请先使用主程序截图功能添加图片</small></div>';

                countEl.textContent = '共 0 张图片';

                return;

            }

            

            countEl.textContent = `共 ${images.length} 张图片`;

            

            grid.innerHTML = images.map(item => {

                const filename = item.filename || item;

                return `

                    <div class="image-picker-card ${filename === currentImage ? 'selected' : ''}" onclick="selectImage('${filename}')">

                        <img src="/api/image/${filename}?_token=${_API_TOKEN}" alt="${filename}">

                        <div class="image-name" title="${filename}">${filename}</div>

                    </div>

                `;

            }).join('');

        })

        .catch(err => {

            grid.innerHTML = '<div class="image-picker-empty">❌ 加载失败</div>';

            countEl.textContent = '';

        });

}



function selectImage(filename) {

    // 更新步骤属性

    updateStepProperty('image', filename);

    

    // 重置偏移为0

    updateStepProperty('offset_x', 0);

    updateStepProperty('offset_y', 0);

    

    // 更新输入框

    const input = document.getElementById('prop-image');

    if (input) input.value = filename;

    

    // 更新偏移预览

    loadImageForOffset(filename);

    

    // 关闭弹窗

    closeImagePickerDialog();

}



// ==================== 自定义拖拽排序 ====================



let dragState = {

    isDragging: false,

    draggedCard: null,

    draggedClone: null,

    draggedIndex: -1,

    placeholder: null,

    startY: 0,

    offsetY: 0

};



function initDrag(card, index, e) {

    const canvas = document.getElementById('canvas');

    const rect = card.getBoundingClientRect();

    

    dragState.isDragging = true;

    dragState.draggedCard = card;

    dragState.draggedIndex = index;

    dragState.startY = e.clientY;

    dragState.offsetY = e.clientY - rect.top;

    

    // 创建拖拽克隆

    dragState.draggedClone = card.cloneNode(true);

    dragState.draggedClone.className = 'step-card drag-clone';

    dragState.draggedClone.style.cssText = `

        position: fixed;

        left: ${rect.left}px;

        top: ${rect.top}px;

        width: ${rect.width}px;

        z-index: 1000;

        pointer-events: none;

        box-shadow: 0 10px 40px rgba(0,0,0,0.3);

        transform: scale(1.02);

        opacity: 0.95;

    `;

    document.body.appendChild(dragState.draggedClone);

    

    // 原卡片变为占位符

    card.classList.add('drag-placeholder');

    

    // 绑定移动和释放事件

    document.addEventListener('mousemove', onDragMove);

    document.addEventListener('mouseup', onDragEnd);

}



function onDragMove(e) {

    if (!dragState.isDragging) return;

    

    // 移动克隆元素

    const clone = dragState.draggedClone;

    clone.style.top = (e.clientY - dragState.offsetY) + 'px';

    

    // 检测其他卡片位置并交换

    const cards = Array.from(document.querySelectorAll('.step-card:not(.drag-placeholder):not(.drag-clone)'));

    const placeholder = document.querySelector('.step-card.drag-placeholder');

    

    if (!placeholder) return;

    

    const placeholderRect = placeholder.getBoundingClientRect();

    const placeholderCenter = placeholderRect.top + placeholderRect.height / 2;

    

    for (const card of cards) {

        const rect = card.getBoundingClientRect();

        const cardCenter = rect.top + rect.height / 2;

        

        // 向上拖动：如果克隆位置在卡片中心以上，交换

        if (e.clientY < cardCenter && placeholderRect.top > rect.top) {

            card.parentNode.insertBefore(placeholder, card);

            break;

        }

        

        // 向下拖动：如果克隆位置在卡片中心以下，交换

        if (e.clientY > cardCenter && placeholderRect.top < rect.top) {

            card.parentNode.insertBefore(placeholder, card.nextSibling);

            break;

        }

    }

}



function onDragEnd(e) {

    if (!dragState.isDragging) return;

    

    document.removeEventListener('mousemove', onDragMove);

    document.removeEventListener('mouseup', onDragEnd);

    

    // 计算最终位置

    const cards = Array.from(document.querySelectorAll('.step-card'));

    const placeholder = document.querySelector('.step-card.drag-placeholder');

    const newIndex = cards.indexOf(placeholder);

    

    // 移除克隆

    if (dragState.draggedClone) {

        dragState.draggedClone.remove();

    }

    

    // 重排数据

    if (newIndex !== -1 && newIndex !== dragState.draggedIndex) {

        reorderStep(dragState.draggedIndex, newIndex);

    } else {

        // 恢复原卡片

        if (placeholder) {

            placeholder.classList.remove('drag-placeholder');

        }

    }

    

    // 重置状态

    dragState.isDragging = false;

    dragState.draggedCard = null;

    dragState.draggedClone = null;

    dragState.draggedIndex = -1;

}



// ==================== 说明编辑器 ====================



let workflowDescription = '';

let workflowDetailUrl = '';



function openDescEditor() {

    document.getElementById('desc-editor-dialog').style.display = 'flex';

    document.getElementById('desc-text').value = workflowDescription || '';

    document.getElementById('desc-url').value = workflowDetailUrl || '';

}



function closeDescEditor() {

    document.getElementById('desc-editor-dialog').style.display = 'none';

}



function saveDescription() {

    workflowDescription = document.getElementById('desc-text').value.trim();

    workflowDetailUrl = document.getElementById('desc-url').value.trim();

    closeDescEditor();

}



// ==================== 获取鼠标坐标 ====================



// 处理预设分辨率

function handlePresetSize(value) {

    updateStepProperty('preset_size', value);

    

    if (value !== '自定义') {

        const sizeMap = {

            '1920x1080': [1920, 1080],

            '1280x720': [1280, 720],

            '1024x768': [1024, 768],

            '800x600': [800, 600],

            '640x480': [640, 480]

        };

        if (sizeMap[value]) {

            const [w, h] = sizeMap[value];

            updateStepProperty('width', w);

            updateStepProperty('height', h);

            document.getElementById('prop-width').value = w;

            document.getElementById('prop-height').value = h;

        }

    }

}



// 处理预设位置

function handlePresetPos(value) {

    updateStepProperty('preset_pos', value);

    // 位置需要在执行时根据屏幕和窗口大小计算，这里只保存预设值

}



// ==================== 鼠标坐标捕获模式（全局偏好，跨步骤同步） ====================

const COORD_CAPTURE_MODE_KEY = 'coord_capture_mode';

const COORD_MODE_OPTIONS = [

    { value: 'both', label: '3秒倒计时 + 左键点击 同时生效（默认）' },

    { value: 'timeout', label: '仅3秒倒计时获取' },

    { value: 'click', label: '仅按下左键获取（30秒超时）' }

];

function getCoordCaptureMode() {

    try {

        const m = localStorage.getItem(COORD_CAPTURE_MODE_KEY);

        return (m === 'timeout' || m === 'click') ? m : 'both';

    } catch (e) {

        return 'both';

    }

}

function setCoordCaptureMode(mode) {

    if (!['both', 'timeout', 'click'].includes(mode)) mode = 'both';

    try { localStorage.setItem(COORD_CAPTURE_MODE_KEY, mode); } catch (e) {}

    // 同步页面上其它选择器，保持当前 workflow 编辑会话内一致

    document.querySelectorAll('.coord-mode-select').forEach(el => {

        if (el.value !== mode) el.value = mode;

    });

}

function renderCoordModeSelector() {

    const cur = getCoordCaptureMode();

    const opts = COORD_MODE_OPTIONS.map(o =>

        `<option value="${o.value}" ${o.value === cur ? 'selected' : ''}>${o.label}</option>`

    ).join('');

    return `

        <select class="form-input coord-mode-select" style="margin-top: 6px; padding: 4px 8px; width: 100%; font-size: 12px;"

                title="坐标获取方式（保存在本地，所有获取按钮共用）"

                onchange="setCoordCaptureMode(this.value)">

            ${opts}

        </select>

    `;

}

// 统一捕获函数：根据当前模式分支处理

function _runCapture(statusEl, fields, typeName) {

    const mode = getCoordCaptureMode();

    let countdown;

    let url;

    let buildTip;

    if (mode === 'timeout') {

        countdown = 3;

        url = '/api/capture_mouse_position?mode=timeout&timeout=3&grace=0';

        buildTip = (n) => `${n} 秒后自动获取${typeName || '坐标'}`;

    } else if (mode === 'click') {

        countdown = 30;

        url = '/api/capture_mouse_position?mode=click&grace=0.3&timeout=30';

        buildTip = (n) => `🖱️ 请在 ${n} 秒内按下左键获取${typeName || '坐标'}`;

    } else {

        countdown = 3;

        url = '/api/capture_mouse_position?mode=both&timeout=3.0&grace=0.3';

        buildTip = (n) => `${n} 秒内按下左键 或 等待倒计时获取${typeName || '坐标'}`;

    }

    let finished = false;

    statusEl.innerHTML = `<span style="color: #f59e0b; font-weight: bold;">⏱️ ${buildTip(countdown)}</span>`;

    fetch(url)

        .then(res => res.json())

        .then(data => {

            if (finished) return;

            finished = true;

            clearInterval(timer);

            if (data.no_click) {

                statusEl.innerHTML = `<span style="color: #ef4444;">❌ 30 秒内未按下左键</span>`;

                setTimeout(() => { statusEl.textContent = '点击后按设定方式获取坐标'; }, 3000);

                return;

            }

            if (data.x !== undefined && data.y !== undefined) {

                fields.forEach((f, i) => {

                    const v = i === 0 ? data.x : data.y;

                    updateStepProperty(f, v);

                    const input = document.getElementById('prop-' + f);

                    if (input) input.value = v;

                });

                const tag = data.method === 'click' ? '🖱️ 点击' : '⏱️ 倒计时';

                statusEl.innerHTML = `<span style="color: #10b981; font-weight: bold;">✅ ${typeName || ''}已获取(${tag}): (${data.x}, ${data.y})</span>`;

                setTimeout(() => { statusEl.textContent = '点击后按设定方式获取坐标'; }, 3000);

            } else {

                statusEl.innerHTML = `<span style="color: #ef4444;">❌ 获取失败</span>`;

            }

        })

        .catch(err => {

            if (finished) return;

            finished = true;

            clearInterval(timer);

            statusEl.innerHTML = `<span style="color: #ef4444;">❌ 获取失败${err && err.message ? ': ' + err.message : ''}</span>`;

        });

    const timer = setInterval(() => {

        if (finished) { clearInterval(timer); return; }

        countdown--;

        if (countdown > 0) {

            statusEl.innerHTML = `<span style="color: #f59e0b; font-weight: bold;">⏱️ ${buildTip(countdown)}</span>`;

        } else {

            clearInterval(timer);

            if (!finished) {

                statusEl.innerHTML = `<span style="color: #6366f1; font-weight: bold;">📍 正在获取...</span>`;

            }

        }

    }, 1000);

}

function captureDragStart() {

    _runCapture(document.getElementById('capture-drag-status'), ['start_x', 'start_y'], '起点');

}

function captureDragEnd() {

    _runCapture(document.getElementById('capture-drag-status'), ['end_x', 'end_y'], '终点');

}

function captureMousePosition() {

    _runCapture(document.getElementById('capture-status'), ['x', 'y'], '');

}



// ==================== 按键识别功能 ====================



let detectedKey = '';

let keyDetectorTargetInput = null;

let keyDetectorListener = null;



// 键盘事件key值到pyautogui按键名的映射

const keyNameMap = {

    ' ': 'space',

    'ArrowUp': 'up',

    'ArrowDown': 'down',

    'ArrowLeft': 'left',

    'ArrowRight': 'right',

    'Control': 'ctrl',

    'Meta': 'win',

    'Escape': 'esc',

    'Enter': 'enter',

    'Tab': 'tab',

    'Backspace': 'backspace',

    'Delete': 'delete',

    'Insert': 'insert',

    'Home': 'home',

    'End': 'end',

    'PageUp': 'pageup',

    'PageDown': 'pagedown',

    'CapsLock': 'capslock',

    'NumLock': 'numlock',

    'ScrollLock': 'scrolllock',

    'Pause': 'pause',

    'PrintScreen': 'printscreen'

};



function openKeyDetector(inputId) {

    keyDetectorTargetInput = inputId;

    detectedKey = '';

    

    document.getElementById('key-detector-result').textContent = '等待按键...';

    document.getElementById('key-detector-use').disabled = true;

    document.getElementById('key-detector-dialog').style.display = 'flex';

    

    // 添加键盘监听

    keyDetectorListener = function(e) {

        e.preventDefault();

        e.stopPropagation();

        

        let keyName = e.key;

        

        // 转换为pyautogui兼容的按键名

        if (keyNameMap[keyName]) {

            keyName = keyNameMap[keyName];

        } else if (keyName.length === 1) {

            // 单个字符，使用小写

            keyName = keyName.toLowerCase();

        } else if (keyName.startsWith('F') && keyName.length <= 3) {

            // 功能键 F1-F12

            keyName = keyName.toLowerCase();

        } else {

            keyName = keyName.toLowerCase();

        }

        

        detectedKey = keyName;

        

        // 显示结果

        const resultEl = document.getElementById('key-detector-result');

        resultEl.innerHTML = `<span style="color: #10b981;">${keyName}</span>`;

        document.getElementById('key-detector-use').disabled = false;

    };

    

    document.addEventListener('keydown', keyDetectorListener);

}



function closeKeyDetector() {

    document.getElementById('key-detector-dialog').style.display = 'none';

    

    // 移除键盘监听

    if (keyDetectorListener) {

        document.removeEventListener('keydown', keyDetectorListener);

        keyDetectorListener = null;

    }

}



function useDetectedKey() {

    if (detectedKey && keyDetectorTargetInput) {

        const input = document.getElementById(keyDetectorTargetInput);

        if (input) {

            input.value = detectedKey;

            // 触发change事件更新步骤属性

            input.dispatchEvent(new Event('change'));

        }

    }

    closeKeyDetector();

}



// ==================== 复制/粘贴/多选操作 ====================



// 复制选中的步骤

function copySelectedSteps() {

    if (selectedStepIndices.size === 0) {

        showMsg('请先选择要复制的步骤', 'warning');

        return;

    }

    

    const steps = getCurrentSteps();

    const indices = Array.from(selectedStepIndices).sort((a, b) => a - b);

    

    // 深拷贝选中的步骤

    clipboardSteps = indices.map(i => JSON.parse(JSON.stringify(steps[i])));

    

    // 保存滚动位置（showMsg可能影响滚动）

    const savedScrollTop = canvasScrollTop;

    showMsg(`已复制 ${clipboardSteps.length} 个步骤`, 'success');

    // 恢复滚动位置

    canvasScrollTop = savedScrollTop;

}



// 粘贴步骤到选中位置后面

function pasteSteps() {

    if (clipboardSteps.length === 0) {

        const savedScrollTop = canvasScrollTop;

        showMsg('剪贴板为空，请先复制步骤', 'warning');

        canvasScrollTop = savedScrollTop;

        return;

    }

    

    const steps = getCurrentGroup().steps;

    

    // 确定插入位置：选中步骤的最后一个后面，或末尾

    let insertIndex;

    if (selectedStepIndices.size > 0) {

        insertIndex = Math.max(...selectedStepIndices) + 1;

    } else {

        insertIndex = steps.length;

    }

    

    // 深拷贝并插入步骤

    const newSteps = clipboardSteps.map(s => JSON.parse(JSON.stringify(s)));

    steps.splice(insertIndex, 0, ...newSteps);

    

    // 选中新粘贴的步骤

    selectedStepIndices.clear();

    for (let i = 0; i < newSteps.length; i++) {

        selectedStepIndices.add(insertIndex + i);

    }

    selectedStepIndex = insertIndex;

    

    updateCanvas();

    updatePropertiesPanel();

    

    // 保存滚动位置（showMsg可能影响滚动）

    const savedScrollTop = canvasScrollTop;

    showMsg(`已粘贴 ${newSteps.length} 个步骤`, 'success');

    canvasScrollTop = savedScrollTop;

}



// 删除选中的多个步骤

function deleteSelectedSteps() {

    if (selectedStepIndices.size === 0) {

        return;

    }

    

    // 直接获取当前canvas的scrollTop

    const canvas = document.getElementById('canvas');

    const currentScrollTop = canvas.scrollTop;

    

    const steps = getCurrentGroup().steps;

    const indices = Array.from(selectedStepIndices).sort((a, b) => b - a); // 从后往前删除

    

    indices.forEach(i => {

        steps.splice(i, 1);

    });

    

    // 清除选择

    selectedStepIndices.clear();

    selectedStepIndex = -1;

    

    // 设置canvasScrollTop

    canvasScrollTop = currentScrollTop;

    

    updateCanvas();

    updatePropertiesPanel();

    

    // 强制再次恢复滚动位置

    requestAnimationFrame(() => {

        canvas.scrollTop = currentScrollTop;

    });

}



// 显示右键菜单

function showContextMenu(x, y) {

    // 移除已存在的菜单

    hideContextMenu();

    

    const menu = document.createElement('div');

    menu.id = 'context-menu';

    menu.className = 'context-menu';

    

    const selectedCount = selectedStepIndices.size;

    const hasClipboard = clipboardSteps.length > 0;

    

    menu.innerHTML = `

        <div class="context-menu-item" onclick="copySelectedSteps(); hideContextMenu();">

            <span>📋</span> 复制 ${selectedCount > 1 ? `(${selectedCount}个)` : ''}

        </div>

        <div class="context-menu-item ${hasClipboard ? '' : 'disabled'}" onclick="${hasClipboard ? 'pasteSteps(); hideContextMenu();' : ''}">

            <span>📥</span> 粘贴 ${hasClipboard ? `(${clipboardSteps.length}个)` : ''}

        </div>

        <div class="context-menu-divider"></div>

        <div class="context-menu-item" onclick="selectAllSteps(); hideContextMenu();">

            <span>☑️</span> 全选

        </div>

        <div class="context-menu-divider"></div>
        
        <div class="context-menu-item" onclick="setSelectedEditable('single'); hideContextMenu();">

            <span>✏️</span> 设为单独可改 ${selectedCount > 1 ? `(${selectedCount}个)` : ''}

        </div>

        <div class="context-menu-item" onclick="setSelectedEditable('batch'); hideContextMenu();">

            <span>🔄</span> 设为批量可改 ${selectedCount > 1 ? `(${selectedCount}个)` : ''}

        </div>

        <div class="context-menu-item" onclick="setSelectedEditable(null); hideContextMenu();">

            <span>🔒</span> 设为不可改 ${selectedCount > 1 ? `(${selectedCount}个)` : ''}

        </div>

        <div class="context-menu-divider"></div>

        <div class="context-menu-item danger" onclick="confirmDeleteSelected();">

            <span>🗑️</span> 删除 ${selectedCount > 1 ? `(${selectedCount}个)` : ''}

        </div>

    `;

    

    document.body.appendChild(menu);

    

    // 调整位置确保不超出屏幕

    const menuRect = menu.getBoundingClientRect();

    if (x + menuRect.width > window.innerWidth) {

        x = window.innerWidth - menuRect.width - 10;

    }

    if (y + menuRect.height > window.innerHeight) {

        y = window.innerHeight - menuRect.height - 10;

    }

    

    menu.style.left = x + 'px';

    menu.style.top = y + 'px';

    

    // 点击其他地方关闭菜单

    setTimeout(() => {

        document.addEventListener('click', hideContextMenu, { once: true });

    }, 0);

}



// 隐藏右键菜单

function hideContextMenu() {

    const menu = document.getElementById('context-menu');

    if (menu) {

        menu.remove();

    }

}



// 确认删除选中的步骤

async function confirmDeleteSelected() {

    hideContextMenu();

    const count = selectedStepIndices.size;

    if (count === 0) return;

    

    if (count > 1) {

        if (!await showConfirm(`确定要删除选中的 ${count} 个步骤吗？`)) {

            return;

        }

    }

    

    deleteSelectedSteps();

}



// ==================== 颜色识别相关函数 ====================



// RGB转十六进制

function rgbToHex(r, g, b) {

    return '#' + [r, g, b].map(x => {

        const hex = Math.round(x).toString(16);

        return hex.length === 1 ? '0' + hex : hex;

    }).join('');

}



// 十六进制转RGB

function hexToRgb(hex) {

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? [

        parseInt(result[1], 16),

        parseInt(result[2], 16),

        parseInt(result[3], 16)

    ] : [255, 255, 255];

}



// 从颜色选择器更新颜色

function updateColorFromPicker(fieldName, hexValue) {

    const rgb = hexToRgb(hexValue);

    updateStepProperty(fieldName, rgb);

    

    // 更新显示

    const display = document.querySelector('.color-rgb-display');

    if (display) {

        display.textContent = `RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

    }

}



// 从屏幕取色（浏览器 EyeDropper，仅颜色）

async function pickColorFromScreen(fieldName) {

    try {

        // 使用 EyeDropper API（Chrome 95+）

        if ('EyeDropper' in window) {

            const eyeDropper = new EyeDropper();

            const result = await eyeDropper.open();

            const rgb = hexToRgb(result.sRGBHex);

            updateStepProperty(fieldName, rgb);

            

            // 更新颜色选择器和显示

            const picker = document.getElementById(`prop-${fieldName}-picker`);

            if (picker) picker.value = result.sRGBHex;

            

            const display = document.querySelector('.color-rgb-display');

            if (display) {

                display.textContent = `RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

            }

            

            showMsg(`已选择颜色: RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, 'success');

        } else {

            showMsg('您的浏览器不支持屏幕取色功能，请使用取色+坐标按钮', 'warning');

        }

    } catch (e) {

        // 用户取消或出错

        console.log('取色取消或失败:', e);

    }

}



// 从屏幕取色并获取坐标（使用 EyeDropper 放大效果 + 后端获取坐标）

async function startPickColorWithCoord(fieldName) {

    try {

        // 检查是否支持 EyeDropper

        if (!('EyeDropper' in window)) {

            showMsg('您的浏览器不支持取色功能，请使用 Chrome 95+ 或 Edge', 'warning');

            return;

        }

        

        // 使用 EyeDropper（有放大效果）

        const eyeDropper = new EyeDropper();

        const result = await eyeDropper.open();

        const rgb = hexToRgb(result.sRGBHex);

        

        // 取色完成后立即获取鼠标位置

        const response = await fetch('/api/mouse_position');

        const posData = await response.json();

        

        if (posData.x !== undefined) {

            // 更新坐标

            updateStepProperty('x', posData.x);

            updateStepProperty('y', posData.y);

            updateStepProperty(fieldName, rgb);

            

            // 更新 UI

            const xInput = document.getElementById('prop-x');

            const yInput = document.getElementById('prop-y');

            if (xInput) xInput.value = posData.x;

            if (yInput) yInput.value = posData.y;

            

            const picker = document.getElementById(`prop-${fieldName}-picker`);

            if (picker) {

                picker.value = result.sRGBHex;

            }

            

            const display = document.querySelector('.color-rgb-display');

            if (display) {

                display.textContent = `RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

            }

            

            showMsg(`已获取: 位置(${posData.x},${posData.y}) RGB(${rgb[0]},${rgb[1]},${rgb[2]})`, 'success');

        } else {

            // 只获取到颜色，没有坐标

            updateStepProperty(fieldName, rgb);

            showMsg(`已获取颜色: RGB(${rgb[0]},${rgb[1]},${rgb[2]})，坐标获取失败`, 'warning');

        }

    } catch (e) {

        // 用户取消或出错

        if (e.message !== 'The user canceled the selection.') {

            showMsg('取色失败: ' + e.message, 'error');

        }

    }

}



// ==================== 可改配置功能 ====================

// 批量设置选中步骤的可改状态
function setSelectedEditable(mode) {
    // 获取所有选中的步骤索引（使用正确的变量名）
    let selectedIndices = [...selectedStepIndices];
    if (selectedStepIndex !== -1 && !selectedIndices.includes(selectedStepIndex)) {
        selectedIndices.push(selectedStepIndex);
    }
    
    if (selectedIndices.length === 0) {
        showToast('请先选择步骤', 'warning');
        return;
    }
    
    // 确保 editable_config 存在
    if (!workflow.editable_config) {
        workflow.editable_config = { enabled: false, items: [] };
    }
    if (!workflow.editable_config.items) {
        workflow.editable_config.items = [];
    }
    
    const groupIndex = currentGroupIndex;
    const steps = getCurrentSteps();
    let changedCount = 0;
    
    // 如果是批量可改模式，需要找到所有完全相同的步骤（操作类型+所有属性）
    // 生成批量ID用于同步
    const batchId = mode === 'batch' ? `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;
    
    // 收集所有要处理的步骤（跨组合）
    // 格式: [{groupIndex, stepIndex, step}]
    let allTargetSteps = [];
    
    // 首先添加当前组合中选中的步骤
    selectedIndices.forEach(stepIndex => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
            allTargetSteps.push({
                groupIndex: groupIndex,
                stepIndex: stepIndex,
                step: steps[stepIndex]
            });
        }
    });
    
    if (mode === 'batch') {
        // 遍历所有组合，找到相同的步骤（使用isSameStep比较）
        const allGroups = workflow.groups || [];
        const originalTargets = [...allTargetSteps];
        
        allGroups.forEach((group, gIdx) => {
            const groupSteps = group.steps || [];
            groupSteps.forEach((otherStep, sIdx) => {
                // 检查是否已在目标列表中
                const alreadyIncluded = allTargetSteps.some(
                    t => t.groupIndex === gIdx && t.stepIndex === sIdx
                );
                if (alreadyIncluded) return;
                
                // 检查是否与任一选中步骤相同
                const isMatch = originalTargets.some(target => isSameStep(otherStep, target.step));
                if (isMatch) {
                    allTargetSteps.push({
                        groupIndex: gIdx,
                        stepIndex: sIdx,
                        step: otherStep
                    });
                }
            });
        });
    }
    
    allTargetSteps.forEach((target, idx) => {
        const { groupIndex: gIdx, stepIndex: sIdx, step } = target;
        const typeConfig = STEP_TYPES[step.type] || { name: step.type };
        
        // 查找现有的可改配置
        const itemIndex = workflow.editable_config.items.findIndex(
            i => i.group_index === gIdx && i.step_index === sIdx
        );
        
        if (mode === null) {
            // 设为不可改：删除现有配置
            if (itemIndex !== -1) {
                workflow.editable_config.items.splice(itemIndex, 1);
                changedCount++;
            }
        } else {
            // 设为可改
            if (itemIndex === -1) {
                // 新增
                workflow.editable_config.items.push({
                    group_index: gIdx,
                    step_index: sIdx,
                    mode: mode,
                    batch_id: batchId,  // 添加批量ID用于同步
                    batch_main: idx === 0,  // 第一个设为主步骤
                    label: `${mode === 'single' ? '✏️单独' : '🔄批量'} - ${step.name || typeConfig.name}`
                });
                changedCount++;
            } else {
                // 更新模式
                workflow.editable_config.items[itemIndex].mode = mode;
                workflow.editable_config.items[itemIndex].batch_id = batchId;
                workflow.editable_config.items[itemIndex].batch_main = idx === 0;
                workflow.editable_config.items[itemIndex].label = `${mode === 'single' ? '✏️单独' : '🔄批量'} - ${step.name || typeConfig.name}`;
                changedCount++;
            }
        }
    });
    
    // 更新enabled状态
    workflow.editable_config.enabled = workflow.editable_config.items.length > 0;
    
    // 保存当前滚动位置
    const container = document.querySelector('.canvas-container');
    const savedScrollTop = container ? container.scrollTop : 0;
    
    updateCanvas();
    
    // 恢复滚动位置
    requestAnimationFrame(() => {
        if (container) {
            container.scrollTop = savedScrollTop;
        }
    });
    
    const modeText = mode === 'single' ? '单独可改' : mode === 'batch' ? '批量可改' : '不可改';
    showToast(`已将 ${changedCount} 个步骤设为${modeText}`, 'success');
}

// 一键清除所有可改状态
function clearAllEditable() {
    if (!workflow.editable_config || !workflow.editable_config.items || workflow.editable_config.items.length === 0) {
        showToast('没有可改项需要清除', 'warning');
        return;
    }
    
    const count = workflow.editable_config.items.length;
    workflow.editable_config.items = [];
    workflow.editable_config.enabled = false;
    
    updateCanvas();
    showToast(`已清除 ${count} 个可改项，全部设为不可改`, 'success');
}



// 比较两个步骤是否"相同"（操作类型+所有属性完全一致）
function isSameStep(step1, step2) {
    if (!step1 || !step2) return false;
    // 必须是相同的操作类型
    if (step1.type !== step2.type) return false;
    
    // 获取该操作类型的所有字段定义
    const typeConfig = STEP_TYPES[step1.type];
    if (!typeConfig || !typeConfig.fields) return false;
    
    // 比较所有字段属性值（必须全部一致才算相同步骤）
    for (const field of typeConfig.fields) {
        const val1 = step1[field.name];
        const val2 = step2[field.name];
        // 用JSON.stringify处理数组/对象类型的比较
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            return false;
        }
    }
    return true;
}

// 获取步骤的可改模式

function getEditableMode(groupIndex, stepIndex) {

    if (!workflow.editable_config || !workflow.editable_config.items) {

        return null;

    }

    const item = workflow.editable_config.items.find(

        i => i.group_index === groupIndex && i.step_index === stepIndex

    );

    return item ? item.mode : null;

}



// 切换步骤的可改状态: null -> single -> batch -> null

function toggleEditable(stepIndex) {

    // 确保 editable_config 存在

    if (!workflow.editable_config) {

        workflow.editable_config = { enabled: false, items: [] };

    }

    if (!workflow.editable_config.items) {

        workflow.editable_config.items = [];

    }

    

    const groupIndex = currentGroupIndex;

    const itemIndex = workflow.editable_config.items.findIndex(

        i => i.group_index === groupIndex && i.step_index === stepIndex

    );

    

    const step = getCurrentSteps()[stepIndex];

    const typeConfig = STEP_TYPES[step.type];

    const defaultLabel = `组${groupIndex + 1} 序号${stepIndex + 1} - ${step.name || typeConfig.name}`;

    

    if (itemIndex === -1) {

        // 不可改 -> 单独可改

        workflow.editable_config.items.push({

            group_index: groupIndex,

            step_index: stepIndex,

            mode: 'single',

            label: defaultLabel

        });

        workflow.editable_config.enabled = true;

        showMsg('已设为单独可改', 'success');

    } else {

        const item = workflow.editable_config.items[itemIndex];

        if (item.mode === 'single') {

            // 单独可改 -> 批量可改
            // 生成批量ID并找到所有组合中相同的步骤（跨组合联动）
            const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const currentStep = getCurrentSteps()[stepIndex];
            
            // 设置当前步骤
            item.mode = 'batch';
            item.batch_id = batchId;
            item.batch_main = true;
            item.label = `🔄批量 - ${step.name || typeConfig.name}`;
            
            // 遍历所有组合，找到所有相同的步骤并添加到批量（使用isSameStep比较）
            let addedCount = 0;
            const allGroups = workflow.groups || [];
            console.log('[批量可改] 开始遍历所有组合，共', allGroups.length, '个组合');
            console.log('[批量可改] 当前步骤:', currentStep.type, currentStep.image || '无image');
            allGroups.forEach((group, gIdx) => {
                const groupSteps = group.steps || [];
                groupSteps.forEach((otherStep, sIdx) => {
                    // 跳过当前步骤自己
                    if (gIdx === groupIndex && sIdx === stepIndex) return;
                    
                    // 检查是否相同（操作类型+关键属性）
                    const isSame = isSameStep(otherStep, currentStep);
                    if (otherStep.type === currentStep.type) {
                        console.log(`[批量可改] 组${gIdx+1}步骤${sIdx+1}: type=${otherStep.type}, image=${otherStep.image || '无'}, isSame=${isSame}`);
                    }
                    if (isSame) {
                        // 检查是否已有配置
                        const existingIdx = workflow.editable_config.items.findIndex(
                            i => i.group_index === gIdx && i.step_index === sIdx
                        );
                        if (existingIdx === -1) {
                            workflow.editable_config.items.push({
                                group_index: gIdx,
                                step_index: sIdx,
                                mode: 'batch',
                                batch_id: batchId,
                                batch_main: false,
                                label: `🔄批量 - ${otherStep.name || STEP_TYPES[otherStep.type]?.name || otherStep.type}`
                            });
                            addedCount++;
                        } else {
                            workflow.editable_config.items[existingIdx].mode = 'batch';
                            workflow.editable_config.items[existingIdx].batch_id = batchId;
                            workflow.editable_config.items[existingIdx].batch_main = false;
                            addedCount++;
                        }
                    }
                });
            });

            showMsg(`已设为批量可改（共${addedCount + 1}个相同操作将同步修改）`, 'success');

        } else {

            // 批量可改 -> 不可改
            // 同时取消所有组合中相同操作和属性的批量可改步骤（跨组合联动）
            const currentStep = getCurrentSteps()[stepIndex];
            
            // 找到所有组合中相同步骤的批量可改配置并删除（使用isSameStep比较）
            const toRemove = [];
            const allGroups = workflow.groups || [];
            workflow.editable_config.items.forEach((otherItem, idx) => {
                if (otherItem.mode === 'batch') {
                    const gIdx = otherItem.group_index;
                    const sIdx = otherItem.step_index;
                    if (gIdx < allGroups.length) {
                        const groupSteps = allGroups[gIdx].steps || [];
                        if (sIdx < groupSteps.length) {
                            const otherStep = groupSteps[sIdx];
                            // 检查是否相同（操作类型+关键属性）
                            if (isSameStep(otherStep, currentStep)) {
                                toRemove.push(idx);
                            }
                        }
                    }
                }
            });
            
            // 从后往前删除，避免索引变化
            toRemove.sort((a, b) => b - a).forEach(idx => {
                workflow.editable_config.items.splice(idx, 1);
            });

            if (workflow.editable_config.items.length === 0) {

                workflow.editable_config.enabled = false;

            }

            showMsg(`已取消 ${toRemove.length} 个同类操作的可改状态`, 'success');

        }

    }

    // 保存当前滚动位置
    const container = document.querySelector('.canvas-container');
    const savedScrollTop = container ? container.scrollTop : 0;

    updateCanvas();
    
    // 恢复滚动位置
    requestAnimationFrame(() => {
        if (container) {
            container.scrollTop = savedScrollTop;
        }
    });

}



// 设置可改项的自定义标签

function setEditableLabel(groupIndex, stepIndex, label) {

    if (!workflow.editable_config || !workflow.editable_config.items) return;

    

    const item = workflow.editable_config.items.find(

        i => i.group_index === groupIndex && i.step_index === stepIndex

    );

    if (item) {

        item.label = label;

    }

}



// 获取可改项列表（用于显示）

function getEditableItems() {

    if (!workflow.editable_config || !workflow.editable_config.items) {

        return [];

    }

    return workflow.editable_config.items.map(item => {

        const group = workflow.groups[item.group_index];

        const step = group ? group.steps[item.step_index] : null;

        return {

            ...item,

            step: step,

            type_config: step ? STEP_TYPES[step.type] : null

        };

    }).filter(item => item.step);

}


// ==================== 搜索功能（仅当前组合） ====================

function searchCurrentGroup() {
    const searchInput = document.getElementById('step-search');
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        showToast('请输入搜索内容', 'warning');
        return;
    }
    
    const steps = getCurrentSteps();
    if (!steps || steps.length === 0) {
        showToast('当前组合没有步骤', 'warning');
        return;
    }
    
    // 搜索匹配的步骤
    const results = [];
    steps.forEach((step, index) => {
        const stepNum = (index + 1).toString();
        const stepType = STEP_TYPES[step.type];
        const defaultName = stepType ? stepType.name : step.type;
        const customName = step.name || '';  // 自定义操作名
        const displayName = customName || defaultName;  // 显示用的名称
        const description = getStepDescription(step);
        
        // 匹配序号、默认名称、自定义名称或描述
        if (stepNum === query || 
            defaultName.toLowerCase().includes(query) || 
            customName.toLowerCase().includes(query) ||
            description.toLowerCase().includes(query)) {
            results.push({ index, stepNum, stepName: displayName, description });
        }
    });
    
    if (results.length === 0) {
        showToast('未找到匹配的操作', 'warning');
        return;
    }
    
    // 如果只有一个结果，直接跳转
    if (results.length === 1) {
        jumpToStep(results[0].index);
        return;
    }
    
    // 多个结果，显示选择面板
    showSearchPanel(results);
}

function showSearchPanel(results) {
    // 移除旧面板
    const oldPanel = document.getElementById('search-panel');
    if (oldPanel) oldPanel.remove();
    
    const panel = document.createElement('div');
    panel.id = 'search-panel';
    panel.style.cssText = `
        position: fixed; top: 55px; left: 50%; transform: translateX(-50%);
        background: #1e293b; border: 1px solid #334155; border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4); max-height: 300px; overflow-y: auto;
        z-index: 10000; min-width: 350px; color: #e2e8f0;
    `;
    
    // 标题
    const header = document.createElement('div');
    header.style.cssText = 'padding: 10px 15px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #0f172a; border-radius: 8px 8px 0 0;';
    header.innerHTML = `<span style="font-weight: bold; color: #60a5fa;">🔍 找到 ${results.length} 个结果</span>
        <span onclick="document.getElementById('search-panel').remove()" style="cursor: pointer; color: #94a3b8;">✕</span>`;
    panel.appendChild(header);
    
    // 结果列表
    results.forEach(r => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #334155;';
        item.innerHTML = `<div style="color: #f1f5f9;">第${r.stepNum}步 - ${r.stepName}</div>
            <div style="color: #94a3b8; font-size: 12px;">${r.description}</div>`;
        item.onmouseenter = () => item.style.background = '#334155';
        item.onmouseleave = () => item.style.background = 'transparent';
        item.onclick = () => { 
            document.getElementById('search-panel').remove();
            jumpToStep(r.index); 
        };
        panel.appendChild(item);
    });
    
    document.body.appendChild(panel);
}

function jumpToStep(stepIndex) {
    // 选中步骤
    selectedStepIndex = stepIndex;
    updateCanvas();
    updatePropertiesPanel();
    
    // 滚动并高亮
    setTimeout(() => {
        const cards = document.querySelectorAll('#canvas .step-card');
        if (cards && cards[stepIndex]) {
            cards[stepIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            cards[stepIndex].style.outline = '3px solid #3b82f6';
            cards[stepIndex].style.outlineOffset = '2px';
            setTimeout(() => {
                cards[stepIndex].style.outline = '';
                cards[stepIndex].style.outlineOffset = '';
            }, 2000);
        }
    }, 100);
    
    showToast(`已定位到第${stepIndex + 1}步`, 'success');
}

// 搜索框回车监听
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('step-search');
    if (input) {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') searchCurrentGroup();
        });
    }
});
