<template>
  <div>
    <!-- 查询区域 -->
    <div class="search-container">
      <Row :gutter="16" class="search-row">
        <!-- 角色名称输入框 -->
        <Col :span="6">
        <i-input v-model="queryForm.roleName" placeholder="请输入角色名称" class="search-input"></i-input>
        </Col>
        <!-- 角色备注输入框 -->
        <Col :span="6">
        <i-input v-model="queryForm.remark" placeholder="请输入角色备注" class="search-input"></i-input>
        </Col>
        <!-- 按钮区域 -->
        <Col :span="12" class="btn-group">
        <i-button type="default" @click="resetQuery">清空</i-button>
        <i-button type="primary" @click="searchRole">搜索</i-button>
        <i-button type="success" @click="addRole">新增</i-button>
        </Col>
      </Row>
    </div>
    <Table :context="self" :data="tableData" :columns="tableColumns" stripe border></Table>
    <div style="margin: 10px;overflow: hidden">
      <div style="float: right;">
        <Page :total="total" :current="page" @on-change="changePage" show-total></Page>
      </div>
    </div>
    <!-- 新增角色模态框 -->
    <Modal v-model="addModalVisible" title="新增角色" @on-ok="handleSubmit" @on-cancel="handleCancel"
      :loading="modalLoading">
      <Form ref="addRoleForm" :model="addRoleForm" :rules="addRoleRules" :label-width="100">
        <Form-item label="角色名称" prop="roleName">
          <Input v-model="addRoleForm.roleName" placeholder="请输入角色名称"></Input>
        </Form-item>
        <Form-item label="角色备注" prop="remark">
          <Input v-model="addRoleForm.remark" placeholder="请输入角色备注"></Input>
        </Form-item>
        <Form-item label="权限菜单" prop="menuIds">
          <!-- 使用 Element UI 的树形控件 -->
          <div
            style="max-height: 300px; overflow-y: auto; border: 1px solid #dcdee2; padding: 10px; border-radius: 4px;">
            <el-tree ref="menuTree" :data="allMenus" show-checkbox node-key="id" :props="{
              children: 'childrenProgramList',
              label: 'programName'
            }" :default-expand-all="true" @check="handleMenuCheck" :check-strictly="false">
            </el-tree>
          </div>
        </Form-item>
      </Form>
    </Modal>
  </div>
</template>
<script>
export default {
  data() {
    return {
      self: this,
      tableData: [],
      total: 0,
      page: 1,
      size: 10,
      // 查询表单数据
      queryForm: {
        roleName: '', // 角色名称查询条件
        remark: ''    // 角色备注查询条件
      },
      isOperate: 0,
      // 新增角色相关
      addModalVisible: false,
      modalLoading: false, // 添加这个
      addRoleForm: {
        roleName: '',
        remark: '',
        menuIds: [] // 选中的菜单ID数组
      },
      addRoleRules: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' }
        ],
        menuIds: [
          {
            required: true,
            message: '请至少选择一个菜单',
            trigger: 'change',
            validator: (rule, value, callback) => {
              // 获取树形控件当前的选中状态
              if (this.$refs.menuTree) {
                const checkedKeys = this.$refs.menuTree.getCheckedKeys();
                if (checkedKeys.length > 0) {
                  callback(); // 验证通过
                } else {
                  callback(new Error('请至少选择一个菜单')); // 验证失败
                }
              } else {
                callback(new Error('菜单数据加载中，请稍后'));
              }
            }
          }
        ]
      },
      allMenus: [], // 所有菜单数据
      tableColumns: [
        {
          title: '角色名称',
          key: 'roleName', // 对应接口返回的roleName字段
          align: 'center'
        },
        {
          title: '角色备注',
          key: 'remark', // 对应接口返回的remark字段
          align: 'center'
        },
        {
          title: '操作',
          key: 'action',
          width: 120,
          align: 'center',
          render: (h, params) => {
            const { index } = params; // 获取当前行索引
            return h('i-button', {
              props: {
                type: 'primary',
                size: 'small'
              },
              on: {
                click: () => this.showPermission(index) // 绑定点击事件
              }
            }, '查看权限'); // 按钮文本
          }
        }
      ]
    }
  },
  methods: {
    getRoleList() {
      const para = {
        page: this.page,
        size: this.size,
        roleName: this.queryForm.roleName,
        remark: this.queryForm.remark
      }
      this.$api.getRoleList(para)
        .then((res) => {
          console.log('角色列表返回', res)
          if (res.code === 200) {
            // 接口数据赋值
            this.tableData = res.data.records; // 角色列表数据
            this.total = res.data.total; // 总条数（用于分页）
          } else {
            this.$Message.error('获取角色列表失败：' + res.message);
          }
        }).catch(err => {
          console.error('接口请求失败', err);
          this.$Message.error('网络错误，请重试');
        });
    },
    // 搜索角色
    searchRole() {
      this.page = 1; // 搜索时重置到第一页
      this.getRoleList();
    },
    // 清空查询条件
    resetQuery() {
      this.queryForm = {
        roleName: '',
        remark: ''
      };
      this.page = 1; // 清空后重置到第一页
      this.getRoleList();
    },
    // 打开新增模态框
    addRole() {
      this.addModalVisible = true;
      this.addRoleForm = { roleName: '', remark: '', menuIds: [] };
      this.getAllMenus(); // 加载所有菜单
    },
    // 关闭模态框
    handleCancel() {
      this.addRoleForm = { roleName: '', remark: '', menuIds: [] };
      this.$refs.addRoleForm.resetFields();
      if (this.$refs.menuTree) {
        this.$refs.menuTree.setCheckedKeys([]);
      }
      this.modalLoading = false; // 添加这行
    },
    // 处理菜单勾选
    handleMenuCheck(checkedNode, checkedKeys) {
      // 更新表单中的menuIds，用于验证
      this.addRoleForm.menuIds = checkedKeys.checkedKeys;

      // 打印当前选中状态
      console.log('当前选中的菜单:', checkedKeys.checkedKeys);
      console.log('半选中的菜单:', checkedKeys.halfCheckedKeys);
    },

    // 获取所有菜单（用于权限选择）
    getAllMenus() {
      const para = { isOperate: 0 };
      this.$api.getProgram(para)
        .then(res => {
          if (res.code === 200) {
            this.allMenus = res.data;
            console.log('菜单数据加载成功，结构如下：');
            this.allMenus.forEach(menu => {
              console.log(`一级菜单: ${menu.programName} (${menu.id})`);
              if (menu.childrenProgramList && menu.childrenProgramList.length > 0) {
                menu.childrenProgramList.forEach(child => {
                  console.log(`  └─ 二级菜单: ${child.programName} (${child.id})`);
                });
              }
            });

            // 如果有之前选中的菜单，设置选中状态
            this.$nextTick(() => {
              if (this.addRoleForm.menuIds.length > 0) {
                this.$refs.menuTree.setCheckedKeys(this.addRoleForm.menuIds);
              }
            });
          } else {
            this.$Message.error('获取菜单失败：' + res.message);
          }
        });
    },
    handleSubmit() {
      this.modalLoading = true;

      this.submitAddRole()
        .finally(() => {
          this.modalLoading = false;
        });
    },
    // 提交新增角色
    submitAddRole() {
      return new Promise((resolve, reject) => {
        this.$refs.addRoleForm.validate(valid => {
          if (!valid) {
            this.$Message.error('表单验证失败，请检查输入');
            return reject();
          }

          try {
            const menuTree = this.$refs.menuTree;

            // 只使用 getCheckedKeys 和 getCheckedNodes
            const checkedKeys = menuTree.getCheckedKeys();
            const checkedNodes = menuTree.getCheckedNodes();

            console.log('选中的键:', checkedKeys);
            console.log('选中的节点:', checkedNodes);

            // 直接从选中的节点中提取所有需要提交的菜单ID
            // 包括选中的节点和它们的父节点
            const allMenuIds = this.getAllRequiredMenuIds(checkedNodes);

            // 构造 programList
            const programList = allMenuIds.map(programId => ({ programId }));

            // 构造提交参数
            const params = {
              roleName: this.addRoleForm.roleName,
              remark: this.addRoleForm.remark,
              programList: programList
            };
            console.log('提交的参数内容:', JSON.stringify(params, null, 2));

            this.$api.addRole(params)
              .then(res => {
                console.log('新增角色接口返回:', res);
                if (res.code === 200) {
                  this.$Message.success('新增角色成功');
                  this.addModalVisible = false;
                  this.getRoleList();
                  resolve();
                } else {
                  // this.$Message.error(res.message || '新增失败');
                  reject();
                }
              })
          } catch (error) {
            console.error('处理菜单数据时出错:', error);
            this.$Message.error('处理菜单数据失败');
            reject();
          }
        });
      });
    },

    // 获取所有需要提交的菜单ID（包括父节点）
    getAllRequiredMenuIds(checkedNodes) {
      const menuIds = new Set();

      checkedNodes.forEach(node => {
        // 添加当前节点
        menuIds.add(node.id);

        // 如果这是二级菜单，添加对应的一级菜单
        if (node.parentId && node.parentId !== '0') {
          menuIds.add(node.parentId);
        }
      });

      return Array.from(menuIds);
    },

    // 查找菜单的父菜单
    findParentMenu(menuId) {
      // 遍历一级菜单
      for (const menu of this.allMenus) {
        // 如果当前就是一级菜单，返回null
        if (menu.id === menuId) {
          return null;
        }

        // 检查二级菜单
        if (menu.childrenProgramList && menu.childrenProgramList.length > 0) {
          for (const childMenu of menu.childrenProgramList) {
            if (childMenu.id === menuId) {
              return menu; // 返回父菜单
            }
          }
        }
      }
      return null;
    },
    showPermission(index) {
      const role = this.tableData[index];
      // 显示角色权限信息（这里用Modal展示，可根据实际需求修改）
      this.$Modal.info({
        title: `【${role.roleName}】的权限`,
        content: `
        <div>
          <p>角色ID：${role.roleId || '暂无'}</p>
          <p>权限列表：${role.programList ? JSON.stringify(role.programList) : '暂无权限数据'}</p>
        </div>
      `,
        render: (h) => {
          // 也可以用VNode语法自定义更复杂的展示
          return h('div', [
            h('p', `角色ID：${role.roleId || '暂无'}`),
            h('p', `权限列表：${role.programList ? JSON.stringify(role.programList) : '暂无权限数据'}`)
          ]);
        }
      });
    },
    changePage(row) {
      this.page = row; // 更新当前页码
      this.getRoleList(); // 重新获取对应页的数据
    }
  },
  created() {
    this.getRoleList();
  }
}
</script>
<style scoped>
h2 {
  padding: 20px;
  text-align: center;
}

/* 查询区域样式 */
.search-container {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
  margin: 0 0 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-row {
  align-items: center;
}

.search-input {
  width: 100%;
}

.btn-group {
  text-align: right;
}

/* 按钮间距 */
.btn-group i-button {
  margin-left: 8px;
}

/* 菜单选择样式 */
.menu-item {
  margin-bottom: 10px;
  padding-left: 10px;
}

.submenu-item {
  margin-left: 20px;
  padding-left: 10px;
  border-left: 1px dashed #ccc;
  margin-top: 5px;
  margin-bottom: 5px;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  margin-bottom: 8px;
  padding-left: 5px;
}

.submenu-item {
  margin-left: 25px;
  padding-left: 10px;
  border-left: 1px dashed #ccc;
  margin-top: 5px;
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 解决 Element UI 复选框与文字对齐问题 */
.el-checkbox {
  align-items: center;
  cursor: pointer;
}
</style>