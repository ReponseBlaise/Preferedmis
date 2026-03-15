// This file has been removed as part of document feature removal.
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('title')} *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('category')}
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                  className="input-field"
                >
                  <option value="general">{t('general')}</option>
                  <option value="report">{t('reports')}</option>
                  <option value="invoice">{t('invoices')}</option>
                  <option value="contract">{t('contracts')}</option>
                  <option value="drawing">{t('drawings')}</option>
                  <option value="permit">{t('permits')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('visibility')}
                </label>
                <select
                  value={uploadForm.visibility}
                  onChange={(e) => setUploadForm({...uploadForm, visibility: e.target.value})}
                  className="input-field"
                >
                  <option value="private">{t('private')} - {t('onlyYouCanAccess')}</option>
                  <option value="shared">{t('shared')} - {t('shareWithSpecificUsers')}</option>
                  <option value="public">{t('public')} - {t('everyoneCanAccess')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {uploading ? t('uploading') : t('upload')}
                </button>
              </div>
            </form >
          </div >
        </div >
      )}

{/* Share Modal */ }
{
  showShareModal && selectedDocument && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('shareDocument')}</h2>
          <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{selectedDocument.title}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectUsers')}
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {availableUsers.map(u => (
                <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareForm.users.includes(u.id)}
                    onChange={() => toggleUserSelection(u.id)}
                    className="rounded"
                  />
                  <span>{u.full_name} ({u.email})</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('permission')}
            </label>
            <select
              value={shareForm.permission}
              onChange={(e) => setShareForm({ ...shareForm, permission: e.target.value })}
              className="input-field"
            >
              <option value="view">{t('viewOnly')}</option>
              <option value="download">{t('viewAndDownload')}</option>
              <option value="edit">{t('edit')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('message')} ({t('optional')})
            </label>
            <textarea
              value={shareForm.message}
              onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
              className="input-field"
              rows={2}
              placeholder={t('addAPersonalMessage')}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 btn-primary"
            >
              {t('share')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
    </div >
  );
};

export default Documents;
