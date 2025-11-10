from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Contact  # 这行导入 models
from config import Config       # 这行导入 config

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db.init_app(app)

# 🔥 添加这个根路由 - 在现有路由之前添加
@app.route('/')
def hello():
    return '''
    <h1>通讯录后端API</h1>
    <p>后端服务运行成功！</p>
    <h3>可用接口：</h3>
    <ul>
        <li>GET /api/contacts - 获取所有联系人</li>
        <li>POST /api/contacts - 添加联系人</li>
        <li>PUT /api/contacts/&lt;id&gt; - 更新联系人</li>
        <li>DELETE /api/contacts/&lt;id&gt; - 删除联系人</li>
    </ul>
    <p>请使用前端界面或API测试工具访问这些接口。</p>
    '''

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    contacts = Contact.query.all()
    return jsonify([{'id': c.id, 'name': c.name, 'phone': c.phone} for c in contacts])

@app.route('/api/contacts', methods=['POST'])
def add_contact():
    data = request.json
    contact = Contact(name=data['name'], phone=data['phone'])
    db.session.add(contact)
    db.session.commit()
    return jsonify({'id': contact.id, 'name': contact.name, 'phone': contact.phone}), 201

@app.route('/api/contacts/<int:id>', methods=['PUT'])
def update_contact(id):
    contact = Contact.query.get_or_404(id)
    data = request.json
    contact.name = data['name']
    contact.phone = data['phone']
    db.session.commit()
    return jsonify({'id': contact.id, 'name': contact.name, 'phone': contact.phone})

@app.route('/api/contacts/<int:id>', methods=['DELETE'])
def delete_contact(id):
    contact = Contact.query.get_or_404(id)
    db.session.delete(contact)
    db.session.commit()
    return '', 204

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)