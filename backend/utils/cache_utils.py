"""
Utilitários para cache Redis
"""
from flask import current_app
import json
from datetime import datetime, date
import hashlib


def get_cache_key(prefix, *args):
    """
    Gera uma chave de cache baseada no prefixo e argumentos
    
    Args:
        prefix (str): Prefixo da chave (ex: 'ranking', 'stats')
        *args: Argumentos adicionais para formar a chave
    
    Returns:
        str: Chave de cache formatada
    """
    key_parts = [str(arg) for arg in args if arg is not None]
    key_suffix = '_'.join(key_parts) if key_parts else 'default'
    return f"{prefix}:{key_suffix}"


def cache_get(key):
    """
    Busca valor no cache
    
    Args:
        key (str): Chave do cache
    
    Returns:
        any: Valor do cache ou None
    """
    try:
        if hasattr(current_app, 'cache'):
            return current_app.cache.get(key)
        else:
            print("⚠️ Cache não configurado")
            return None
    except Exception as e:
        print(f"❌ Erro ao buscar cache {key}: {e}")
        return None


def cache_set(key, value, timeout=None):
    """
    Define valor no cache
    
    Args:
        key (str): Chave do cache
        value (any): Valor a ser cacheado
        timeout (int): Timeout em segundos (usa config padrão se None)
    
    Returns:
        bool: True se conseguiu cachear, False caso contrário
    """
    try:
        if hasattr(current_app, 'cache'):
            cache_timeout = timeout or current_app.config.get('CACHE_DEFAULT_TIMEOUT', 300)
            current_app.cache.set(key, value, timeout=cache_timeout)
            print(f"✅ Cache definido: {key} (timeout: {cache_timeout}s)")
            return True
        else:
            print("⚠️ Cache não configurado")
            return False
    except Exception as e:
        print(f"❌ Erro ao definir cache {key}: {e}")
        return False


def cache_delete(key):
    """
    Remove valor do cache
    
    Args:
        key (str): Chave do cache
    
    Returns:
        bool: True se removeu, False caso contrário
    """
    try:
        if hasattr(current_app, 'cache'):
            current_app.cache.delete(key)
            print(f"🗑️ Cache removido: {key}")
            return True
        else:
            print("⚠️ Cache não configurado")
            return False
    except Exception as e:
        print(f"❌ Erro ao remover cache {key}: {e}")
        return False


def cache_clear_pattern(pattern):
    """
    Remove todas as chaves que correspondem a um padrão
    
    Args:
        pattern (str): Padrão das chaves (ex: 'ranking_*')
    """
    try:
        if hasattr(current_app, 'cache'):
            # Para Flask-Caching com Redis
            if hasattr(current_app.cache.cache, 'delete_many'):
                current_app.cache.cache.delete_many(pattern)
            print(f"🗑️ Cache limpo: {pattern}")
            return True
        else:
            print("⚠️ Cache não configurado")
            return False
    except Exception as e:
        print(f"❌ Erro ao limpar cache {pattern}: {e}")
        return False


def cached_function(timeout=None, key_prefix=None):
    """
    Decorator para cachear resultado de função
    
    Args:
        timeout (int): Timeout do cache
        key_prefix (str): Prefixo da chave
    
    Usage:
        @cached_function(timeout=600, key_prefix='ranking')
        def get_ranking():
            return expensive_operation()
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Gerar chave baseada na função e argumentos
            func_name = func.__name__
            prefix = key_prefix or func_name
            
            # Criar hash dos argumentos para chave única
            args_str = str(args) + str(sorted(kwargs.items()))
            args_hash = hashlib.md5(args_str.encode()).hexdigest()[:8]
            
            cache_key = get_cache_key(prefix, args_hash)
            
            # Tentar buscar no cache
            cached_result = cache_get(cache_key)
            if cached_result is not None:
                print(f"🎯 Cache hit: {cache_key}")
                return cached_result
            
            # Executar função e cachear resultado
            result = func(*args, **kwargs)
            if result is not None:
                cache_set(cache_key, result, timeout)
                print(f"💾 Cache miss -> cached: {cache_key}")
            
            return result
        
        return wrapper
    return decorator


# Funções específicas para limpar cache de diferentes tipos
def invalidate_rankings_cache():
    """Invalida cache de rankings"""
    cache_clear_pattern('ranking_*')


def invalidate_stats_cache():
    """Invalida cache de estatísticas"""
    cache_clear_pattern('stats_*')


def invalidate_plantoes_cache():
    """Invalida cache de plantões"""
    cache_clear_pattern('plantoes_*')