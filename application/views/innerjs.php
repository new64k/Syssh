
	<script type="text/javascript">$('section[hash="'+hash+'"]').on('sectionload sectionshow',function(){controller='<?=CONTROLLER?>';affair='<?=@$this->user->permission[CONTROLLER]['_controller_name']?>';action='<?=METHOD?>';username='<?=$this->user->name?>';sysname='<?=$this->company->sysname?>';<?=$this->inner_js?>})</script>