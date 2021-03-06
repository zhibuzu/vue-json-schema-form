/**
 * Created by Liu.Jun on 2020/12/27 9:53 下午.
 */

import { h } from 'vue';

import { resolveComponent } from '@lljj/vjsf-utils/vue3Utils';

export default {
    name: 'FormFooter',
    props: {
        okBtn: {
            type: String,
            default: '保存'
        },
        cancelBtn: {
            type: String,
            default: '取消'
        },
        globalOptions: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['cancel', 'submit'],
    setup(props, { emit }) {
        // globalOptions 不需要响应式
        const { globalOptions: { COMPONENT_MAP } } = props;

        return () => h(COMPONENT_MAP.formItem, {
            class: {
                formFooter_item: true
            }
        }, [
            h(resolveComponent(COMPONENT_MAP.button), {
                onClick() {
                    emit('cancel');
                }
            }, props.cancelBtn),
            h(resolveComponent(COMPONENT_MAP.button), {
                style: {
                    marginLeft: '10px'
                },
                type: 'primary',
                onClick() {
                    emit('submit');
                }
            }, props.okBtn)
        ]);
    }
};
