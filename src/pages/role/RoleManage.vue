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
    <Modal v-model="addModalVisible" title="新增角色" @on-ok="submitAddRole" @on-cancel="handleCancel">
      <Form ref="addRoleForm" :model="addRoleForm" :rules="addRoleRules" :label-width="100">
        <Form-item label="角色名称" prop="roleName">
          <Input v-model="addRoleForm.roleName" placeholder="请输入角色名称"></Input>
        </Form-item>
        <Form-item label="角色备注" prop="remark">
          <Input v-model="addRoleForm.remark" placeholder="请输入角色备注"></Input>
        </Form-item>
        <Form-item label="权限菜单" prop="menuIds">
          <CheckboxGroup v-model="addRoleForm.menuIds">
            <div v-for="menu in allMenus" :key="menu.programId" class="menu-item">
              <!-- 递归渲染多级菜单 -->
              <template v-if="menu.childrenProgramList && menu.childrenProgramList.length > 0">
                <Checkbox :label="menu.programId">{{ menu.programName }}</Checkbox>
                <div class="submenu-item">
                  <CheckboxGroup v-model="addRoleForm.menuIds">
                    <Checkbox 
                      v-for="subMenu in menu.childrenProgramList" 
                      :key="subMenu.programId" 
                      :label="subMenu.programId"
                    >
                      {{ subMenu.programName }}
                    </Checkbox>
                  </CheckboxGroup>
                </div>
              </template>
              <template v-else>
                <Checkbox :label="menu.programId">{{ menu.programName }}</Checkbox>
              </template>
            </div>
          </CheckboxGroup>
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
          { required: true, message: '请至少选择一个菜单', trigger: 'change' }
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
      this.$refs.addRoleForm.resetFields();
    },
    // 获取所有菜单（用于权限选择）
    getAllMenus() {
      const para = { isOperate: 0 }; 
      this.$api.getProgram(para)
        .then(res => {
          if (res.code === 200) {
            this.allMenus = res.data;
          } else {
            this.$Message.error('获取菜单失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('获取菜单失败', err);
          this.$Message.error('网络错误，请重试');
        });
    },
    // 提交新增角色
    submitAddRole() {
      this.$refs.addRoleForm.validate(valid => {
        if (valid) {
          // 构造提交参数
          const params = {
            roleName: this.addRoleForm.roleName,
            remark: this.addRoleForm.remark,
            menuIds: this.addRoleForm.menuIds.join(',') // 转为逗号分隔的字符串
          };

          // 调用新增角色API
          this.$api.addRole(params)
            .then(res => {
              if (res.code === 200) {
                this.$Message.success('新增角色成功');
                this.addModalVisible = false;
                this.getRoleList(); // 刷新角色列表
              } else {
                this.$Message.error('新增失败：' + res.message);
              }
            })
            .catch(err => {
              console.error('新增角色失败', err);
              this.$Message.error('网络错误，请重试');
            });
        }
      });
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

.ivu-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>